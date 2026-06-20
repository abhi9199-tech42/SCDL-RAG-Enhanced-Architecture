"""
Test 1: Load Test — Ramp-up concurrent /v1/detect requests.
Measures throughput, latency percentiles, and error rate under normal load.
"""
import time, json, sys, random, statistics
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

BASE = Path(__file__).resolve().parent.parent
API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}

DOCUMENTS = [
    {"id": "d1", "content": "Photosynthesis is how plants convert sunlight into chemical energy. The overall equation is 6CO2 + 6H2O -> C6H12O6 + 6O2."},
    {"id": "d2", "content": "DNA has a double helix structure discovered by Watson and Crick. A pairs with T and C pairs with G."},
    {"id": "d3", "content": "Gradient descent is the workhorse optimization algorithm in machine learning. You compute the gradient of the loss function and take steps in the opposite direction."},
    {"id": "d4", "content": "The roman empire at its peak stretched from Britain to Mesopotamia. It lasted roughly 500 years from 27 BCE to 476 CE."},
    {"id": "d5", "content": "Marie Curie discovered polonium and radium. She won Nobel prizes in both physics and chemistry."},
]

SCENARIOS = [
    # (question, answer, hallucinated?)
    ("What is photosynthesis?", "plants convert sunlight into chemical energy", False),
    ("What is photosynthesis?", "plants convert moonlight into nuclear power", True),
    ("What is DNA structure?", "double helix structure with A-T and C-G pairing", False),
    ("What is DNA structure?", "single strand of amino acids", True),
    ("What is gradient descent?", "optimization algorithm in machine learning", False),
    ("What is gradient descent?", "a type of neural network architecture", True),
    ("What did Marie Curie discover?", "polonium and radium", False),
    ("What did Marie Curie discover?", "the theory of relativity", True),
    ("Roman empire duration?", "500 years from 27 BCE to 476 CE", False),
    ("Roman empire duration?", "1000 years from 500 BCE to 500 CE", True),
]

def detect(question, answer):
    try:
        r = requests.post(f"{API}/v1/detect", headers=H,
            json={"question": question, "answer": answer, "documents": DOCUMENTS[:1]}, timeout=30)
        if r.status_code == 200:
            d = r.json()
            return {"ok": True, "mu": d.get("mu_score", 0), "hall": d.get("hallucination_detected"),
                    "time_ms": d.get("processing_time_ms", 0), "latency": r.elapsed.total_seconds() * 1000}
        return {"ok": False, "error": f"HTTP {r.status_code}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def run_load_test(label, concurrency, duration_sec):
    print(f"\n{'='*60}")
    print(f"{label}")
    print(f"{'='*60}")
    print(f"Concurrency: {concurrency}, Duration: {duration_sec}s")
    results = []
    errors = 0
    t_start = time.time()
    stop_time = t_start + duration_sec

    with ThreadPoolExecutor(max_workers=concurrency) as ex:
        while time.time() < stop_time:
            futures = []
            batch_start = time.time()
            for _ in range(concurrency):
                q, a, _ = SCENARIOS[random.randint(0, len(SCENARIOS)-1)]
                futures.append(ex.submit(detect, q, a))
            for f in as_completed(futures):
                r = f.result()
                if r["ok"]:
                    results.append(r)
                else:
                    errors += 1
            batch_time = time.time() - batch_start
            if batch_time < 0.5:
                time.sleep(0.5 - batch_time)

    elapsed = time.time() - t_start
    n = len(results)
    latencies = [r["latency"] for r in results]
    mu_scores = [r["mu"] for r in results]

    print(f"\n  Results:")
    print(f"  Total requests: {n}")
    print(f"  Errors: {errors}")
    print(f"  Duration: {elapsed:.1f}s")
    print(f"  Throughput: {n/elapsed:.1f} req/s")
    if latencies:
        latencies.sort()
        p50 = statistics.median(latencies)
        p95 = latencies[int(len(latencies)*0.95)]
        p99 = latencies[int(len(latencies)*0.99)]
        avg = statistics.mean(latencies)
        print(f"  Latency: avg={avg:.0f}ms  p50={p50:.0f}ms  p95={p95:.0f}ms  p99={p99:.0f}ms")
    if mu_scores:
        print(f"  Avg mu_score: {statistics.mean(mu_scores):.4f}")

    return {"label": label, "total": n, "errors": errors, "duration": elapsed,
            "throughput": n/elapsed, "p50": p50, "p95": p95, "p99": p99, "avg_latency": statistics.mean(latencies) if latencies else 0}

if __name__ == "__main__":
    print("Pre-warming models...")
    r = requests.get(f"{API}/v1/health", headers=H, timeout=5)
    print(f"  Health: {r.json()}")

    # Warm up NLI model with a dummy detect call
    detect("test", "test")
    print("  Models warmed\n")

    # Phase 1: Low load (2 concurrent)
    r1 = run_load_test("PHASE 1: LOW LOAD", concurrency=2, duration_sec=20)

    # Phase 2: Medium load (5 concurrent)
    r2 = run_load_test("PHASE 2: MEDIUM LOAD", concurrency=5, duration_sec=20)

    # Phase 3: High load (10 concurrent)
    r3 = run_load_test("PHASE 3: HIGH LOAD", concurrency=10, duration_sec=30)

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    for r in [r1, r2, r3]:
        print(f"  {r['label']}: {r['total']} req, {r['throughput']:.1f} r/s, p50={r['p50']:.0f}ms, p95={r['p95']:.0f}ms, errors={r['errors']}")
    print("\nLoad test complete.")
