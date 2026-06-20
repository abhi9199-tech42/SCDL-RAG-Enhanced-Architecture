"""
Async throughput benchmark — tests 4-worker async queue.
Hits the API server on port 8003 (started externally).
"""
import requests, time, sys

API = "http://127.0.0.1:8003"
H = {"Authorization": "Bearer sk_live_local_test"}
DOCS = [{"id": "d1", "content": "test content"}]

# Check health
try:
    r = requests.get(f"{API}/v1/health", headers=H, timeout=5)
    if r.status_code != 200:
        print(f"Server not ready: {r.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"Cannot reach server on port 8003: {e}")
    sys.exit(1)

print(f"Server OK. Benchmarking async queue...")

N = 500

print(f"Submitting {N} async tasks ...")
t0 = time.time()
tasks = []
for i in range(N):
    r = requests.post(f"{API}/v1/async/detect", headers=H, json={
        "question": f"bench {i}", "answer": f"ans {i}", "documents": DOCS
    }, timeout=30)
    if r.status_code != 202:
        print(f"Submit failed at {i}: {r.status_code}")
        break
    tasks.append(r.json()["task_id"])
submit_time = time.time() - t0
print(f"Submit: {len(tasks)} tasks in {submit_time:.1f}s ({len(tasks)/submit_time:.0f} tasks/s)")

if not tasks:
    sys.exit(1)

print(f"Polling {len(tasks)} tasks for completion...")
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
        comp_rate = completed / elapsed if elapsed else 0
        print(f"  {i+1}/{len(tasks)}: {completed} done, {failed} failed ({elapsed:.0f}s, {comp_rate:.1f} t/s)")

poll_time = time.time() - t0
total_time = submit_time + poll_time
comp_rate = completed / poll_time if poll_time else 0
print(f"\n{'='*60}")
print(f"RESULTS: {completed}/{len(tasks)} completed, {failed}/{len(tasks)} failed")
print(f"Submit: {submit_time:.1f}s ({len(tasks)/submit_time:.0f} tasks/s)")
print(f"Process: {poll_time:.1f}s ({comp_rate:.1f} tasks/s)")
print(f"Total: {total_time:.1f}s")
print(f"{'='*60}")
