"""
Accurate async throughput benchmark — measures time-to-completion correctly.
Submits N tasks, records when last one finishes.
"""
import requests, time, sys

API = "http://127.0.0.1:8003"
H = {"Authorization": "Bearer sk_live_local_test"}
DOCS = [{"id": "d1", "content": "Photosynthesis converts sunlight into chemical energy using chlorophyll."}]

N = 200  # moderate size for accurate timing

# Submit all
t_submit_start = time.time()
tasks = []
for i in range(N):
    r = requests.post(f"{API}/v1/async/detect", headers=H, json={
        "question": f"bench_{i}", "answer": f"result_{i}", "documents": DOCS
    }, timeout=30)
    if r.status_code != 202:
        print(f"Submit failed at {i}: {r.status_code}")
        break
    tasks.append(r.json()["task_id"])
t_submit_end = time.time()

# Poll with timeout tracking
completed = 0
failed = 0
pending = set(tasks)
t_first_done = None
t_last_done = None

deadline = time.time() + 120  # 2 min max
while pending and time.time() < deadline:
    batch = list(pending)[:50]
    for tid in batch:
        try:
            r = requests.get(f"{API}/v1/async/result/{tid}", headers=H, timeout=5)
            s = r.json()["status"]
            if s == "completed":
                pending.remove(tid)
                completed += 1
                now = time.time()
                if t_first_done is None:
                    t_first_done = now
                t_last_done = now
            elif s == "failed":
                pending.remove(tid)
                failed += 1
        except:
            pass
    time.sleep(0.5)

total = completed + failed
submit_time = t_submit_end - t_submit_start
if t_first_done and t_last_done:
    first_to_last = t_last_done - t_first_done
    throughput = completed / first_to_last if first_to_last else 0
else:
    first_to_last = 0
    throughput = 0

print(f"\n{'='*60}")
print(f"ASYNC 4-WORKER BENCHMARK")
print(f"{'='*60}")
print(f"Submitted:   {total}/{N} in {submit_time:.1f}s ({total/submit_time:.0f} t/s)")
print(f"Completed:   {completed}")
print(f"Failed:      {failed}")
print(f"First done:  {(t_first_done - t_submit_start) if t_first_done else 'N/A':.1f}s after submit")
print(f"Last done:   {(t_last_done - t_submit_start) if t_last_done else 'N/A':.1f}s after submit")
if first_to_last:
    print(f"Completion window: {first_to_last:.1f}s")
    print(f"Sustained throughput: {throughput:.1f} tasks/s")
print(f"Pending:     {len(pending)}")
print(f"{'='*60}")
