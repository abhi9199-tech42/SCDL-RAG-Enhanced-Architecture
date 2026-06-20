"""
Test 1c: Find the HARD breaking point — where timeouts actually begin.
Pushes to 300, 500, 1000 concurrent.
"""
import requests, time, statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}
DOCS = [{"id": "d1", "content": "Photosynthesis is how plants convert sunlight into chemical energy using chlorophyll."}]

print(f"{'Concurr':>8} | {'Total':>6} | {'OK':>6} | {'Fail':>6} | {'r/s':>6} | {'p50':>8} | {'p95':>8} | {'p99':>8} | {'Err%':>6}")
print("-" * 90)

for concurrent in [200, 300, 500]:
    duration = 12
    results = []
    errors = 0
    t0 = time.time()
    end_time = t0 + duration

    with ThreadPoolExecutor(max_workers=concurrent) as ex:
        while time.time() < end_time:
            futs = []
            for _ in range(concurrent):
                futs.append(ex.submit(lambda: __import__('requests').post(
                    f"{API}/v1/detect", headers=H,
                    json={"question": f"test {hash(str(time.time()))}", "answer": "unique answer",
                          "documents": DOCS}, timeout=30
                )))
            for f in __import__('concurrent').futures.as_completed(futs):
                try:
                    r = f.result()
                    if r.status_code == 200:
                        results.append(r.elapsed.total_seconds() * 1000)
                    else:
                        errors += 1
                except:
                    errors += 1

    elapsed = time.time() - t0
    total = len(results) + errors
    rps = total / elapsed if elapsed else 0
    latencies = sorted(results)
    p50 = latencies[len(latencies)//2] if latencies else 0
    p95 = latencies[int(len(latencies)*0.95)] if latencies and len(latencies) > 5 else (latencies[-1] if latencies else 0)
    p99 = latencies[int(len(latencies)*0.99)] if latencies and len(latencies) > 10 else (latencies[-1] if latencies else 0)
    err_pct = errors / total * 100 if total else 0
    marker = " <<< BREAK" if err_pct > 5 else ""
    print(f"{concurrent:>8} | {total:>6} | {len(results):>6} | {errors:>6} | {rps:>5.1f} | {p50:>7.0f} | {p95:>7.0f} | {p99:>7.0f} | {err_pct:>5.1f}%{marker}")
    if err_pct > 10:
        print(f">>> HARD BREAKING POINT: {concurrent} concurrent")
        break

print("\nDone.")
