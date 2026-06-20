"""
Test 2: Stress Test — Hit all 4 endpoints with mixed traffic under high load.
Measures system breaking point, error rates, and endpoint-specific latency.
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
    {"id": "d3", "content": "Gradient descent is the workhorse optimization algorithm in machine learning."},
    {"id": "d4", "content": "The roman empire at its peak stretched from Britain to Mesopotamia. It lasted roughly 500 years."},
    {"id": "d5", "content": "Neural networks have layers of interconnected nodes called neurons. Each connection has a weight."},
]

POOL = [
    {"id": "p1", "content": "Photosynthesis is how plants convert sunlight into chemical energy using chlorophyll."},
    {"id": "p2", "content": "DNA has a double helix structure. A pairs with T. C pairs with G."},
    {"id": "p3", "content": "Gradient descent is the workhorse optimization algorithm in machine learning."},
    {"id": "p4", "content": "The roman empire lasted about 500 years from 27 BCE to 476 CE."},
    {"id": "p5", "content": "Neural networks are computing systems inspired by biological brains."},
]

SCENARIOS = [
    {"question": "What is photosynthesis?", "answer": "plants convert moonlight into energy", "docs": DOCUMENTS[:1], "pool": POOL},
    {"question": "What is DNA?", "answer": "double helix structure", "docs": DOCUMENTS[:1], "pool": POOL},
    {"question": "What is gradient descent?", "answer": "workhorse optimization algorithm in machine learning", "docs": [{"id":"bad","content":"Neural networks have nodes called neurons."}], "pool": POOL},
    {"question": "Roman empire duration?", "answer": "about 500 years", "docs": DOCUMENTS[:1], "pool": POOL},
    {"question": "What is a neural network?", "answer": "a type of programming language", "docs": DOCUMENTS[:1], "pool": POOL},
]

def call_endpoint(endpoint, body):
    try:
        r = requests.post(f"{API}{endpoint}", headers=H, json=body, timeout=60)
        return {"ok": r.status_code == 200, "status": r.status_code, "body": r.json() if r.status_code == 200 else None,
                "latency": r.elapsed.total_seconds() * 1000}
    except Exception as e:
        return {"ok": False, "error": str(e), "latency": 0}

def run_stress_test(concurrency, duration_sec):
    print(f"\n{'='*60}")
    print(f"STRESS TEST — {concurrency} concurrent users, {duration_sec}s")
    print(f"{'='*60}")
    results = {"/v1/detect": [], "/v1/detect-and-fix": [], "/v1/batch/detect-and-fix": [], "/v1/health": []}
    errors = 0
    t_start = time.time()
    stop_time = t_start + duration_sec

    endpoints = ["/v1/detect", "/v1/detect-and-fix", "/v1/batch/detect-and-fix", "/v1/health"]
    weights = [0.4, 0.3, 0.2, 0.1]  # 40% detect, 30% fix, 20% batch, 10% health

    with ThreadPoolExecutor(max_workers=concurrency) as ex:
        while time.time() < stop_time:
            fut_map = {}
            for _ in range(concurrency):
                ep = random.choices(endpoints, weights=weights)[0]
                if ep == "/v1/health":
                    fut = ex.submit(lambda ep=ep: (ep, call_endpoint("/v1/health", {})))
                elif ep == "/v1/detect":
                    s = random.choice(SCENARIOS)
                    fut = ex.submit(lambda s=s, ep=ep: (ep, call_endpoint("/v1/detect", {"question": s["question"], "answer": s["answer"], "documents": s["docs"]})))
                elif ep == "/v1/detect-and-fix":
                    s = random.choice(SCENARIOS)
                    fut = ex.submit(lambda s=s, ep=ep: (ep, call_endpoint("/v1/detect-and-fix", {"question": s["question"], "answer": s["answer"], "documents": s["docs"], "document_pool": s["pool"], "auto_fix": True})))
                elif ep == "/v1/batch/detect-and-fix":
                    s_list = random.choices(SCENARIOS, k=3)
                    bc = [{"id": f"c{j}", "question": s["question"], "answer": s["answer"], "documents": s["docs"]} for j, s in enumerate(s_list)]
                    fut = ex.submit(lambda bc=bc, ep=ep: (ep, call_endpoint("/v1/batch/detect-and-fix", {"batch_id": "stress", "cases": bc, "auto_fix": False})))

                fut_map[fut] = ep

            for f in as_completed(fut_map):
                ep_name, r = f.result()
                if r["ok"]:
                    results[ep_name].append(r)
                else:
                    errors += 1

    elapsed = time.time() - t_start
    total_req = sum(len(v) for v in results.values())

    print(f"\nTotal requests: {total_req}")
    print(f"Errors: {errors}")
    print(f"Duration: {elapsed:.1f}s")
    print(f"Throughput: {total_req/elapsed:.1f} req/s")
    print(f"\nPer-endpoint:")
    for ep, rs in results.items():
        if not rs: continue
        lats = [r["latency"] for r in rs]
        lats.sort()
        p50 = statistics.median(lats)
        p95 = lats[int(len(lats)*0.95)]
        p99 = lats[int(len(lats)*0.99)]
        print(f"  {ep:<30} count={len(rs):>4}  p50={p50:.0f}ms  p95={p95:.0f}ms  p99={p99:.0f}ms")

    return {"total": total_req, "errors": errors, "duration": elapsed, "throughput": total_req/elapsed, "per_endpoint": {ep: len(rs) for ep, rs in results.items()}}

if __name__ == "__main__":
    print("Pre-warming models...")
    r = requests.get(f"{API}/v1/health", headers=H, timeout=5)
    print(f"  Health: {r.json()}")

    warm = requests.post(f"{API}/v1/detect", headers=H, json={"question":"warmup","answer":"test","documents":[{"id":"w","content":"test content."}]}, timeout=60)
    print(f"  Models warmed (status={warm.status_code})\n")

    r1 = run_stress_test(concurrency=5, duration_sec=15)
    r2 = run_stress_test(concurrency=15, duration_sec=20)
    r3 = run_stress_test(concurrency=30, duration_sec=25)

    print(f"\n{'='*60}")
    print("STRESS TEST SUMMARY")
    print(f"{'='*60}")
    for i, r in enumerate([r1, r2, r3]):
        conc = [5, 15, 30][i]
        print(f"  {conc} concurrent: {r['total']} req, {r['throughput']:.1f} r/s, {r['errors']} errors")
    print("\nStress test complete.")
