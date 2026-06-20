"""
Timing breakdown: embedding classify vs full API detect.
Times each step in the API gateway to find the bottleneck.
"""
import os, sys, time, subprocess, requests as rq, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import socket
API_PORT = 8006
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
DOC = [{"id": "d1", "content": "Photosynthesis converts sunlight into chemical energy using chlorophyll. It happens in chloroplasts."}]

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

# ======
# TEST 1: Direct embedding classify — per-request timing
# ======
print("=" * 65)
print("TEST 1: Embedding /classify direct (single request timing)")
print("=" * 65)

times = []
for i in range(20):
    t0 = time.time()
    r = rq.post("http://127.0.0.1:4096/classify",
        json={"pairs": [[f"test_{i} sun conversion", f"chlorophyll energy"]]},
        timeout=30)
    elapsed = (time.time() - t0) * 1000
    if r.status_code == 200:
        times.append(elapsed)
    print(f"  Request {i:2d}: {elapsed:6.1f}ms  (status={r.status_code})")

avg_embed = sum(times) / len(times) if times else 0
print(f"\n  Embed direct avg: {avg_embed:.1f}ms")
print(f"  Min: {min(times):.1f}ms  Max: {max(times):.1f}ms")

# ======
# TEST 2: Full API detect via httpx — per-request timing
# ======
print("\n" + "=" * 65)
print("TEST 2: API /v1/detect via httpx (single request timing)")
print("=" * 65)

times = []
for i in range(20):
    t0 = time.time()
    r = rq.post(f"{API}/v1/detect", headers=H,
        json={"question": f"test_{i}: what is photosynthesis", "answer": f"chlorophyll energy answer {i}", "documents": DOC},
        timeout=30)
    elapsed = (time.time() - t0) * 1000
    if r.status_code == 200:
        times.append(elapsed)
    print(f"  Request {i:2d}: {elapsed:6.1f}ms  (status={r.status_code})")

avg_api = sum(times) / len(times) if times else 0
print(f"\n  API detect avg:  {avg_api:.1f}ms")
print(f"  Min: {min(times):.1f}ms  Max: {max(times):.1f}ms")

# ======
# VERDICT
# ======
print("\n" + "=" * 65)
print("VERDICT")
print("=" * 65)
ratio = avg_api / avg_embed if avg_embed else 0
print(f"  Embed direct:  {avg_embed:.0f}ms")
print(f"  API gateway:   {avg_api:.0f}ms")
print(f"  Ratio:         {ratio:.1f}x slower")
if ratio > 3:
    print("  >>> API is blocking. Likely httpx.Client() sync call blocking")
    print("      the uvicorn thread pool. Switch to httpx.AsyncClient with")
    print("      async def endpoints.")
elif ratio > 1.5:
    print("  >>> Acceptable overhead for the extra classify + embed calls.")
else:
    print("  >>> Good efficiency. httpx pool is working well.")
print("=" * 65)

# Cleanup
proc.kill()
proc.wait()
