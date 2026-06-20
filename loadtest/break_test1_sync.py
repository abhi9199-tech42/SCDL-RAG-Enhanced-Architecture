"""
Test 1: Sync /v1/detect ramp — find concurrent user breaking point.
"""
import requests, time, statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}
DOCS = [{"id": "d1", "content": "Photosynthesis is how plants convert sunlight into chemical energy using chlorophyll."}]
SCENARIO = ("What is photosynthesis?", "plants convert sunlight into chemical energy")

print(f"{'Concurr':>8} | {'Total':>6} | {'OK':>6} | {'Fail':>6} | {'r/s':>6} | {'p50':>8} | {'p95':>8} | {'Err%':>6}")
print("-" * 80)

for concurrent in [5, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200]:
    duration = 8
    results = []
    errors = 0
    t0 = time.time()
    end_time = t0 + duration

    def make_request():
        try:
            r = requests.post(f"{API}/v1/detect", headers=H,
                json={"question": SCENARIO[0], "answer": SCENARIO[1], "documents": DOCS},
                timeout=30)
            if r.status_code == 200:
                return r.elapsed.total_seconds() * 1000
            return None
        except:
            return None

    with ThreadPoolExecutor(max_workers=concurrent) as ex:
        while time.time() < end_time:
            futs = [ex.submit(make_request) for _ in range(concurrent)]
            for f in as_completed(futs):
                r = f.result()
                if r is not None:
                    results.append(r)
                else:
                    errors += 1

    elapsed = time.time() - t0
    total = len(results) + errors
    rps = total / elapsed if elapsed else 0
    latencies = sorted(results)
    p50 = latencies[len(latencies)//2] if latencies else 0
    p95 = latencies[int(len(latencies)*0.95)] if latencies and len(latencies) > 5 else (latencies[-1] if latencies else 0)
    err_pct = errors / total * 100 if total else 0
    marker = " <<< BREAK" if err_pct > 5 else ""
    print(f"{concurrent:>8} | {total:>6} | {len(results):>6} | {errors:>6} | {rps:>5.1f} | {p50:>7.0f} | {p95:>7.0f} | {err_pct:>5.1f}%{marker}")
    if err_pct > 10:
        print(f"\n>>> BREAKING POINT: {concurrent} concurrent users ({errors}/{total} errors)")
        break
