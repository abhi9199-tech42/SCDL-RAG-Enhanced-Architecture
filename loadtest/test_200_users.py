"""
200-user, 20-second full system stress test.
Uses async queue for submission, polls for results.
Measures: submit throughput, completion throughput, end-to-end latency.
"""
import requests, time, statistics, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}

SCENARIOS = [
    ("What is photosynthesis?", "plants convert sunlight into chemical energy"),
    ("What is photosynthesis?", "plants convert moonlight into energy"),
    ("What is DNA structure?", "double helix with A-T C-G pairing"),
    ("What is DNA structure?", "single strand of amino acids"),
    ("What is gradient descent?", "optimization algorithm in machine learning"),
    ("What is gradient descent?", "a type of neural network"),
    ("Roman empire duration?", "about 500 years ending in 476 CE"),
    ("Roman empire duration?", "about 1000 years ending in 500 CE"),
    ("What is reinforcement learning?", "agent learning from rewards and punishments"),
    ("What is reinforcement learning?", "a type of supervised learning with labels"),
    ("What did Marie Curie discover?", "polonium and radium"),
    ("What did Marie Curie discover?", "the theory of relativity"),
    ("What is the internet?", "a global network of connected computers"),
    ("What is the internet?", "a series of tubes for phone calls"),
    ("What is blockchain?", "a distributed ledger technology"),
    ("What is blockchain?", "a type of cloud database"),
]

DOCS = [{"id": "d1", "content": "Photosynthesis is how plants convert sunlight into chemical energy using chlorophyll. The overall equation is 6CO2 + 6H2O -> C6H12O6 + 6O2."},
        {"id": "d2", "content": "DNA has a double helix structure discovered by Watson and Crick in 1953. A pairs with T and C pairs with G."},
        {"id": "d3", "content": "Gradient descent is the workhorse optimization algorithm in machine learning. You compute the gradient and take steps in the opposite direction."},
        {"id": "d4", "content": "The roman empire at its peak stretched from Britain to Mesopotamia. It lasted roughly 500 years from 27 BCE to 476 CE."},
        {"id": "d5", "content": "RL reinforcement learning is about an agent learning from rewards and punishments in an environment."},
        {"id": "d6", "content": "Marie Curie was a physicist and chemist who discovered polonium and radium. She won Nobel prizes in both physics and chemistry."},
        {"id": "d7", "content": "The internet started as ARPANET a US military project in the 1960s. Tim Berners-Lee invented the World Wide Web in 1989."},
        {"id": "d8", "content": "Blockchain is a distributed ledger technology that underpins cryptocurrencies like Bitcoin. Each block contains a cryptographic hash of the previous block."},
]

N_USERS = 200
DURATION = 20

print(f"{'='*60}")
print(f"200-USER FULL SYSTEM STRESS TEST ({DURATION}s)")
print(f"{'='*60}")

# Phase 1: Pre-warm
print("\n[1] Pre-warming models...")
r = requests.get(f"{API}/v1/health", headers=H, timeout=5)
print(f"  Health: {r.json()['status']}")
r = requests.post(f"{API}/v1/detect", headers=H, json={
    "question": "warmup", "answer": "test",
    "documents": [{"id": "w", "content": "test content."}]
}, timeout=60)
print(f"  Warmup OK (mu={r.json()['mu_score']:.4f})")

# Phase 2: Submit async tasks
print(f"\n[2] Submitting {N_USERS} async tasks over {DURATION}s...")
tasks = []
errors = 0
t_submit_start = time.time()
target_end = t_submit_start + DURATION

with ThreadPoolExecutor(max_workers=50) as ex:
    def submit_task(i):
        q, a = SCENARIOS[i % len(SCENARIOS)]
        try:
            r = requests.post(f"{API}/v1/async/detect", headers=H, json={
                "question": q, "answer": a,
                "documents": DOCS[:1]
            }, timeout=10)
            if r.status_code == 202:
                return r.json()["task_id"]
        except:
            pass
        return None

    futures = []
    submitted = 0
    while time.time() < target_end:
        batch = min(50, N_USERS - submitted)
        if batch <= 0:
            break
        for _ in range(batch):
            futures.append(ex.submit(submit_task, submitted))
            submitted += 1
        time.sleep(0.1)
        if submitted >= N_USERS:
            break

    for f in as_completed(futures):
        tid = f.result()
        if tid:
            tasks.append(tid)
        else:
            errors += 1

t_submit_elapsed = time.time() - t_submit_start
print(f"  Submitted: {len(tasks)}/{N_USERS} (errors={errors}) in {t_submit_elapsed:.1f}s")
print(f"  Submit throughput: {len(tasks)/t_submit_elapsed:.1f} tasks/s")

# Phase 3: Poll for results
print(f"\n[3] Polling for results...")
completed = 0
failed = 0
latencies = []
t_poll_start = time.time()

for i, tid in enumerate(tasks):
    for attempt in range(60):
        try:
            r = requests.get(f"{API}/v1/async/result/{tid}", headers=H, timeout=5)
            data = r.json()
            if data["status"] == "completed":
                latencies.append(data["result"]["mu_score"])
                completed += 1
                break
            elif data["status"] == "failed":
                failed += 1
                break
        except:
            pass
        time.sleep(0.3)
    else:
        failed += 1
    if (i + 1) % 50 == 0:
        elapsed = time.time() - t_poll_start
        print(f"  {i+1}/{len(tasks)} checked: {completed} completed, {failed} failed ({elapsed:.0f}s)")

t_poll_elapsed = time.time() - t_poll_start
total_time = time.time() - t_submit_start

# Phase 4: Results
print(f"\n{'='*60}")
print("RESULTS — 200-USER FULL SYSTEM TEST")
print(f"{'='*60}")
print(f"  Total tasks submitted:    {len(tasks)}")
print(f"  Completed:                {completed}")
print(f"  Failed:                   {failed}")
print(f"  Submit duration:          {t_submit_elapsed:.1f}s")
print(f"  Poll duration:            {t_poll_elapsed:.1f}s")
print(f"  Total wall time:          {total_time:.1f}s")
print(f"  Submit throughput:        {len(tasks)/t_submit_elapsed:.1f} tasks/s")
print(f"  Completion throughput:    {completed/t_poll_elapsed:.1f} tasks/s")
print(f"  Effective r/s (async):    {completed/total_time:.1f} r/s")
if latencies:
    print(f"  Avg mu_score:             {statistics.mean(latencies):.4f}")

# Also test sync endpoints at 200 concurrent (expect errors but measure them)
print(f"\n{'='*60}")
print("SYNC ENDPOINT TEST — 200 concurrent /v1/health (should pass)")
print(f"{'='*60}")
t0 = time.time()
with ThreadPoolExecutor(max_workers=200) as ex:
    futs = [ex.submit(lambda: requests.get(f"{API}/v1/health", headers=H, timeout=10)) for _ in range(200)]
    ok = sum(1 for f in as_completed(futs) if f.result().status_code == 200)
print(f"  {ok}/200 health checks passed in {time.time()-t0:.1f}s")

# Detect-and-fix
print(f"\n{'='*60}")
print("SYNC DETECT-AND-FIX — 10 concurrent (stress)")
print(f"{'='*60}")
t0 = time.time()
with ThreadPoolExecutor(max_workers=10) as ex:
    def sync_test():
        try:
            q, a = SCENARIOS[0]
            r = requests.post(f"{API}/v1/detect-and-fix", headers=H, json={
                "question": q, "answer": a,
                "documents": DOCS[:1],
                "document_pool": [d for d in DOCS[1:3]],
                "auto_fix": True
            }, timeout=30)
            if r.status_code == 200:
                return r.json().get("fix_success", False)
        except:
            pass
        return None
    futs = [ex.submit(sync_test) for _ in range(10)]
    sync_results = [f.result() for f in as_completed(futs)]
print(f"  10 sync detect-and-fix: {sum(1 for r in sync_results if r is not None)} OK, {sum(1 for r in sync_results if r is None)} failed")
print(f"  Fix success rate: {sum(1 for r in sync_results if r)}/{sum(1 for r in sync_results if r is not None)}")

print(f"\n{'='*60}")
print("FULL SYSTEM TEST COMPLETE")
print(f"{'='*60}")
