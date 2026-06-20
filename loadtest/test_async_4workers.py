"""
Async throughput benchmark — verifies multi-worker fix.
Starts server programmatically, submits tasks, measures throughput.
"""
import os, sys, time, threading, requests, collections

os.environ["EMBEDDING_SERVICE_URL"] = "http://127.0.0.1:4096"
os.environ["ASYNC_WORKERS"] = "4"

# Import and start server
import uvicorn
from api.server import app
from threading import Thread

server_thread = Thread(target=lambda: uvicorn.run(app, host="127.0.0.1", port=8003, log_level="error"), daemon=True)
server_thread.start()
time.sleep(4)

# Verify health
API = "http://127.0.0.1:8003"
H = {"Authorization": "Bearer sk_live_local_test"}
try:
    r = requests.get(f"{API}/v1/health", headers=H, timeout=5)
    print(f"Server: {r.status_code} {r.json().get('status')}")
except Exception as e:
    print(f"Server failed: {e}")
    sys.exit(1)

# Benchmark
DOCS = [{"id": "d1", "content": "test content"}]
N = 500

print(f"\nSubmitting {N} async tasks ...")
t0 = time.time()
tasks = []
for i in range(N):
    r = requests.post(f"{API}/v1/async/detect", headers=H, json={
        "question": f"test {i}", "answer": f"ans {i}", "documents": DOCS
    }, timeout=30)
    assert r.status_code == 202, f"Submit failed: {r.status_code}"
    tasks.append(r.json()["task_id"])
submit_time = time.time() - t0
print(f"Submit: {N} tasks in {submit_time:.1f}s ({N/submit_time:.0f} tasks/s)")

# Poll
print(f"Polling {N} tasks for completion...")
t0 = time.time()
completed = 0
failed = 0
for i, tid in enumerate(tasks):
    for _ in range(300):
        r = requests.get(f"{API}/v1/async/result/{tid}", headers=H, timeout=5)
        s = r.json()["status"]
        if s == "completed":
            completed += 1
            break
        elif s == "failed":
            failed += 1
            break
        time.sleep(0.1)
    else:
        failed += 1
    if (i + 1) % 100 == 0:
        elapsed = time.time() - t0
        print(f"  {i+1}/{N}: {completed} done, {failed} failed ({elapsed:.0f}s)")

poll_time = time.time() - t0
print(f"\nResults: {completed}/{N} completed, {failed}/{N} failed")
print(f"Submit: {submit_time:.1f}s ({N/submit_time:.0f} t/s), Complete: {poll_time:.1f}s ({completed/poll_time:.1f} t/s)")
print(f"Total: {submit_time + poll_time:.1f}s")
