"""
Test 3: Endurance/Soak Test — Sustained load over time to detect memory leaks
and performance degradation. Mix of detect + detect-and-fix + batch.
"""
import time, json, sys, random, statistics
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

BASE = Path(__file__).resolve().parent.parent
API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}

DOCUMENTS = [
    {"id": "d1", "content": "Photosynthesis is how plants convert sunlight into chemical energy using chlorophyll. The overall equation is 6CO2 + 6H2O -> C6H12O6 + 6O2."},
    {"id": "d2", "content": "DNA has a double helix structure discovered by Watson and Crick in 1953 based on X-ray crystallography data from Rosalind Franklin."},
    {"id": "d3", "content": "Gradient descent is the workhorse optimization algorithm in machine learning. You compute the gradient of the loss function and take steps in the opposite direction."},
]

POOL = [
    {"id": "p1", "content": "Photosynthesis is how plants convert sunlight into chemical energy."},
    {"id": "p2", "content": "DNA has a double helix structure. A pairs with T and C pairs with G."},
    {"id": "p3", "content": "Gradient descent is the workhorse optimization algorithm in machine learning."},
    {"id": "p4", "content": "The roman empire lasted about 500 years from 27 BCE to 476 CE."},
]

SCENARIOS = [
    ("What is photosynthesis?", "plants convert sunlight into chemical energy"),
    ("What is photosynthesis?", "plants convert moonlight into energy"),
    ("What is DNA structure?", "double helix with A-T C-G pairing"),
    ("What is DNA structure?", "single strand of amino acids"),
    ("What is gradient descent?", "optimization algorithm in machine learning"),
    ("What is gradient descent?", "a type of neural network"),
    ("Roman empire duration?", "about 500 years ending in 476 CE"),
    ("Roman empire duration?", "about 1000 years ending in 500 CE"),
]

def detect(question, answer):
    try:
        r = requests.post(f"{API}/v1/detect", headers=H,
            json={"question": question, "answer": answer, "documents": DOCUMENTS}, timeout=30)
        return {"ok": r.status_code == 200, "latency": r.elapsed.total_seconds() * 1000,
                "hall": r.json().get("hallucination_detected") if r.status_code == 200 else None,
                "mu": r.json().get("mu_score") if r.status_code == 200 else None}
    except Exception as e:
        return {"ok": False, "latency": 0, "error": str(e)}

def detect_and_fix(question, answer):
    try:
        r = requests.post(f"{API}/v1/detect-and-fix", headers=H,
            json={"question": question, "answer": answer, "documents": DOCUMENTS[:1],
                  "document_pool": POOL, "auto_fix": True}, timeout=30)
        return {"ok": r.status_code == 200, "latency": r.elapsed.total_seconds() * 1000,
                "fix_success": r.json().get("fix_success") if r.status_code == 200 else None}
    except Exception as e:
        return {"ok": False, "latency": 0, "error": str(e)}

def batch():
    cases = [{"id": f"c{j}", "question": s[0], "answer": s[1], "documents": DOCUMENTS}
             for j, s in enumerate(random.choices(SCENARIOS, k=5))]
    try:
        r = requests.post(f"{API}/v1/batch/detect-and-fix", headers=H,
            json={"batch_id": "endurance", "cases": cases, "auto_fix": True}, timeout=60)
        return {"ok": r.status_code == 200, "latency": r.elapsed.total_seconds() * 1000}
    except Exception as e:
        return {"ok": False, "latency": 0, "error": str(e)}

if __name__ == "__main__":
    print("Pre-warming models...")
    r = requests.get(f"{API}/v1/health", headers=H, timeout=5)
    print(f"  Health: {r.json()}")
    detect("warmup", "test")
    print("  Models warmed\n")

    concurrency = 4
    duration_sec = 120  # 2 minutes
    print(f"{'='*60}")
    print(f"ENDURANCE TEST — {concurrency} concurrent, {duration_sec}s")
    print(f"{'='*60}")

    results = {"detect": [], "detect-and-fix": [], "batch": []}
    errors = 0

    t_start = time.time()
    stop_time = t_start + duration_sec
    report_interval = 30
    last_report = t_start

    with ThreadPoolExecutor(max_workers=concurrency) as ex:
        while time.time() < stop_time:
            futures = []
            for _ in range(concurrency):
                action = random.choices(["detect", "detect-and-fix", "batch"], weights=[0.5, 0.3, 0.2])[0]
                s = random.choice(SCENARIOS)
                if action == "detect":
                    futures.append((action, ex.submit(detect, s[0], s[1])))
                elif action == "detect-and-fix":
                    futures.append((action, ex.submit(detect_and_fix, s[0], s[1])))
                else:
                    futures.append((action, ex.submit(batch)))

            for action, f in futures:
                r = f.result()
                if r["ok"]:
                    results[action].append(r)
                else:
                    errors += 1

            now = time.time()
            if now - last_report >= report_interval:
                elapsed = now - t_start
                total_ok = sum(len(v) for v in results.values())
                print(f"  [{elapsed:3.0f}s] req={total_ok:>4} err={errors:>2} "
                      f"thrpt={total_ok/elapsed:.1f} r/s", flush=True)
                last_report = now

    elapsed = time.time() - t_start
    total_ok = sum(len(v) for v in results.values())

    print(f"\n{'='*60}")
    print("ENDURANCE RESULTS")
    print(f"{'='*60}")
    print(f"Total successful: {total_ok}")
    print(f"Errors: {errors}")
    print(f"Duration: {elapsed:.1f}s")
    print(f"Overall throughput: {total_ok/elapsed:.1f} req/s")

    print(f"\nPer-endpoint:")
    for action, rs in results.items():
        if not rs: continue
        lats = [r["latency"] for r in rs]
        lats.sort()
        p50 = statistics.median(lats)
        p95 = lats[int(len(lats)*0.95)]
        p99 = lats[int(len(lats)*0.99)]
        rps_action = len(rs) / elapsed
        print(f"  {action:<15} count={len(rs):>4}  {rps_action:.1f} r/s  p50={p50:.0f}ms  p95={p95:.0f}ms  p99={p99:.0f}ms")

    # Check for degradation: compare first half vs second half latency
    for action, rs in results.items():
        if len(rs) < 10: continue
        half = len(rs) // 2
        first_half = sorted([r["latency"] for r in rs[:half]])
        second_half = sorted([r["latency"] for r in rs[half:]])
        if first_half and second_half:
            first_p50 = statistics.median(first_half)
            second_p50 = statistics.median(second_half)
            degradation = ((second_p50 - first_p50) / first_p50 * 100) if first_p50 > 0 else 0
            flag = " [DEGRADATION]" if degradation > 20 else " [stable]"
            print(f"  {action:<15} latency trend: {first_p50:.0f}ms -> {second_p50:.0f}ms ({degradation:+.0f}%){flag}")

    print("\nEndurance test complete.")
