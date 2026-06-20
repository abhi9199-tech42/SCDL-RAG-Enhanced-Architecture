"""Test async queue under load - submit 50 tasks, poll for results."""
import requests, time
API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}

tasks = []
print("Submitting 50 async tasks...")
for i in range(50):
    r = requests.post(f"{API}/v1/async/detect", headers=H, json={
        "question": f"What is test {i}?",
        "answer": "some answer content",
        "documents": [{"id": "d1", "content": "test content for the question."}]
    }, timeout=10)
    tasks.append(r.json())
    d = r.json()
    print(f"  Queued {i+1}/50: task_id={d['task_id'][:20]}... depth={d['queue_depth']}")

print("\nPolling results...")
completed = 0
failed = 0
timed_out = 0
for i, t in enumerate(tasks):
    for attempt in range(30):
        r = requests.get(f"{API}/v1/async/result/{t['task_id']}", headers=H, timeout=5)
        data = r.json()
        if data["status"] == "completed":
            print(f"  Task {i+1}: completed, mu={data['result']['mu_score']:.4f}")
            completed += 1
            break
        elif data["status"] == "failed":
            print(f"  Task {i+1}: FAILED - {data.get('error','unknown')}")
            failed += 1
            break
        time.sleep(0.2)
    else:
        print(f"  Task {i+1}: timeout")
        timed_out += 1

print(f"\nResults: {completed} completed, {failed} failed, {timed_out} timed out")
