"""
Benchmark: serial /v1/detect vs batch /v1/detect/batch.
Starts server, runs both modes, compares throughput.
"""
import os, sys, time, subprocess, requests as rq, json
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import socket
API_PORT = 8007
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

# Start server
env = os.environ.copy()
env.update({"EMBEDDING_SERVICE_URL": "http://127.0.0.1:4096", "ASYNC_WORKERS": "4", "PORT": str(API_PORT)})
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "api.server:app", "--host", "127.0.0.1", "--port", str(API_PORT)],
    cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
time.sleep(6)

try:
    r = rq.get(f"{API}/v1/health", headers=H, timeout=5)
    assert r.status_code == 200
    print(f"Server OK on {API_PORT}\n")
except:
    proc.kill()
    print("Server failed")
    sys.exit(1)

# Warmup
for _ in range(3):
    rq.post(f"{API}/v1/detect", headers=H,
        json={"question":"warmup","answer":"warmup","documents":[{"id":"w","content":"warmup"}]},
        timeout=30)

# Build test cases
N_CASES = 50
DOCS_TEMPLATES = [
    "Photosynthesis converts sunlight into chemical energy using chlorophyll.",
    "DNA has a double helix structure discovered by Watson and Crick.",
    "Gradient descent is the core optimization algorithm in machine learning.",
    "The roman empire dominated the mediterranean for over 500 years.",
    "Marie Curie won Nobel prizes in both physics and chemistry.",
    "The internet started as ARPANET in the 1960s.",
    "Blockchain is a distributed immutable ledger technology.",
    "Earths temperature has risen 1.2C since preindustrial times.",
    "The moon is earths only natural satellite at 384400 km.",
    "Neural networks are computing systems inspired by biological brains.",
]

def make_case(i):
    doc = DOCS_TEMPLATES[i % len(DOCS_TEMPLATES)]
    return {
        "id": f"case{i}",
        "question": f"Tell me about topic {i}",
        "answer": f"Answer to topic {i} that relates to {doc[:20]}",
        "documents": [{"id": f"d{i}", "content": doc}]
    }

all_cases = [make_case(i) for i in range(N_CASES)]

# ======
# TEST 1: Serial /v1/detect (N parallel HTTP requests)
# ======
print("=" * 65)
print("TEST 1: Serial /v1/detect — N parallel HTTP requests")
print("=" * 65)

t0 = time.time()
ok = 0
errs = 0
con = 10
with ThreadPoolExecutor(max_workers=con) as ex:
    futs = []
    for c in all_cases:
        futs.append(ex.submit(lambda c=c: rq.post(
            f"{API}/v1/detect", headers=H,
            json={"question": c["question"], "answer": c["answer"], "documents": c["documents"]},
            timeout=60
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

serial_time = time.time() - t0
serial_rps = ok / serial_time if serial_time else 0
latency_per = serial_time / max(ok, 1)  # doesn't account for concurrency properly
print(f"  {ok}/{ok+errs} OK, {errs} errs")
print(f"  Time: {serial_time:.1f}s")
print(f"  Throughput: {serial_rps:.1f} r/s")

# ======
# TEST 2: Batch /v1/detect/batch — one HTTP call
# ======
print("\n" + "=" * 65)
print("TEST 2: Batch /v1/detect/batch — one HTTP call")
print("=" * 65)

# Test different batch sizes
for batch_size in [5, 10, 25, 50]:
    times = []
    ok_b = 0
    errs_b = 0
    for _ in range(3):
        batch_cases = all_cases[:batch_size]
        t0 = time.time()
        r = rq.post(f"{API}/v1/detect/batch", headers=H,
            json={"cases": batch_cases}, timeout=120)
        elapsed = (time.time() - t0) * 1000
        if r.status_code == 200:
            data = r.json()
            ok_b += len(data["results"])
            times.append(data["total_time_ms"])
        else:
            errs_b += batch_size
    avg_time = sum(times) / len(times) if times else 0
    per_case = avg_time / batch_size if batch_size else 0
    throughput = batch_size / (avg_time / 1000) if avg_time else 0
    print(f"  Batch {batch_size:2d}: {avg_time:6.0f}ms total, {per_case:5.1f}ms/case, {throughput:5.1f} r/s ({ok_b}/{ok_b+errs_b} OK)")

print("\n" + "=" * 65)
print("COMPARISON")
print("=" * 65)
print(f"  Serial  (10 concurrent): {serial_rps:.1f} r/s  (latency: {serial_time/max(ok,1)*1000:.0f}ms/req)")
print(f"  Batch 50 (1 HTTP call):  N/A")
# Show batch-50 throughput
r50 = rq.post(f"{API}/v1/detect/batch", headers=H,
    json={"cases": all_cases[:50]}, timeout=120)
if r50.status_code == 200:
    d50 = r50.json()
    print(f"  Batch 50 (1 HTTP call):  {(50/(d50['total_time_ms']/1000)):.1f} r/s  (latency: {d50['per_case_ms']}ms/case)")
print("=" * 65)

# Cleanup
proc.kill()
proc.wait()
