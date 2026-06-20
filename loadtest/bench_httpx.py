"""
Benchmark: httpx connection pool fix.
Starts server as subprocess, benchmarks sync throughput, stops.
"""
import os, sys, time, subprocess, requests as rq, signal
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Find a free port
import socket
API_PORT = 8005
while True:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", API_PORT))
        s.close()
        break
    except OSError:
        s.close()
        API_PORT += 1

API = f"http://127.0.0.1:{API_PORT}"
H = {"Authorization": "Bearer sk_live_local_test"}

# Start API server
env = os.environ.copy()
env.update({"EMBEDDING_SERVICE_URL": "http://127.0.0.1:4096", "ASYNC_WORKERS": "4", "PORT": str(API_PORT)})
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "api.server:app", "--host", "127.0.0.1", "--port", str(API_PORT)],
    cwd=ROOT, env=env,
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
time.sleep(6)

# Verify
try:
    r = rq.get(f"{API}/v1/health", headers=H, timeout=5)
    assert r.status_code == 200, f"Health: {r.status_code}"
    print(f"Server: OK on port {API_PORT}")
except Exception as e:
    print(f"Server failed: {e}")
    proc.kill()
    sys.exit(1)

# --------------------------------------------------------
# TEST 1: Embedding service direct
# --------------------------------------------------------
print("\n" + "="*60)
print("TEST 1: Embedding DIRECT /classify (baseline)")
print("="*60)

N = 200
con = 10
DOCS = [{"id":"d1","content":"Photosynthesis converts sunlight into chemical energy using chlorophyll."}]

def embed_direct(i):
    r = rq.post("http://127.0.0.1:4096/classify",
        json={"pairs": [[f"dir_{i}", f"ans_{i}"]]}, timeout=30)
    return r.status_code == 200

t0 = time.time()
ok = 0
errs = 0
with ThreadPoolExecutor(max_workers=con) as ex:
    futs = [ex.submit(lambda i=i: embed_direct(i)) for i in range(N)]
    for f in as_completed(futs):
        if f.result():
            ok += 1
        else:
            errs += 1

elapsed = time.time() - t0
rps_embed = ok / elapsed if elapsed else 0
print(f"  {ok}/{ok+errs} OK, {errs} errs, {elapsed:.1f}s => {rps_embed:.1f} r/s")

# --------------------------------------------------------
# TEST 2: API gateway via httpx
# --------------------------------------------------------
print("\n" + "="*60)
print("TEST 2: API GATEWAY /v1/detect via httpx pool")
print("="*60)

# Generate 200 unique pairs from a large template pool
TEMPLATES = [
    ("What is photosynthesis?", "plants convert sunlight into chemical energy"),
    ("What is DNA?", "double helix with base pairs"),
    ("What is ML?", "machines learning from data"),
    ("What is gravity?", "force attracting masses"),
    ("What is a CPU?", "central processing unit"),
    ("What is HTTP?", "hypertext transfer protocol"),
    ("What is SQL?", "structured query language"),
    ("What is RAM?", "random access memory"),
    ("What is GPU?", "graphics processing unit"),
    ("What is API?", "application programming interface"),
]

# Make them unique by appending index
t0 = time.time()
ok = 0
errs = 0
with ThreadPoolExecutor(max_workers=con) as ex:
    futs = []
    for i in range(N):
        base_q, base_a = TEMPLATES[i % len(TEMPLATES)]
        q = f"{base_q} {hash(f'uniq_{i}') % 100000}"
        a = f"{base_a} {hash(f'ans_{i}') % 100000}"
        futs.append(ex.submit(lambda q=q, a=a: rq.post(
            f"{API}/v1/detect", headers=H,
            json={"question": q, "answer": a, "documents": DOCS},
            timeout=30
        )))
    for f in as_completed(futs):
        try:
            r = f.result()
            if r.status_code == 200:
                ok += 1
            else:
                errs += 1
        except:
            errs += 1

elapsed = time.time() - t0
rps_api = ok / elapsed if elapsed else 0
print(f"  {ok}/{ok+errs} OK, {errs} errs, {elapsed:.1f}s => {rps_api:.1f} r/s")

# --------------------------------------------------------
# RESULT
# --------------------------------------------------------
print("\n" + "="*60)
print("RESULT")
print("="*60)
efficiency = (rps_api / rps_embed) * 100 if rps_embed else 0
print(f"  Embedding direct:  {rps_embed:.1f} r/s")
print(f"  API via httpx:     {rps_api:.1f} r/s")
print(f"  Efficiency:        {efficiency:.0f}%")
print(f"  Loss:              {100-efficiency:.0f}%")
if efficiency >= 80:
    print("  VERDICT: httpx fix works (>=80% efficiency)")
else:
    label = "needs batch endpoint" if efficiency < 50 else "acceptable"
    print(f"  VERDICT: {efficiency:.0f}% efficiency — {label}")
print("="*60)

# Cleanup
proc.kill()
proc.wait()
print(f"\nServer stopped.")
