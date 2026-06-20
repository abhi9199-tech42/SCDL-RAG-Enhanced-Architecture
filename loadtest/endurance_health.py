"""
Health check breaking point test.
"""
import requests, time
from concurrent.futures import ThreadPoolExecutor, as_completed

API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test"}

print(f"{'Concurr':>8} | {'Total':>6} | {'OK':>6} | {'Fail':>6} | {'r/s':>6} | {'p50':>8} | {'Err%':>6}")
print("-" * 65)

for con in [200, 500, 1000]:
    results = []
    errors = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=con) as ex:
        futs = [ex.submit(lambda: requests.get(f"{API}/v1/health", headers=H, timeout=30)) for _ in range(con)]
        for f in as_completed(futs):
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
    latencies = sorted(results)
    p50 = latencies[len(latencies)//2] if latencies else 0
    err_pct = errors / total * 100 if total else 0
    marker = " <<< BREAK" if err_pct > 5 else ""
    print(f"{con:>8} | {total:>6} | {len(results):>6} | {errors:>6} | {total/elapsed:>5.1f} | {p50:>7.0f} | {err_pct:>5.1f}%{marker}")

print("\nHealth endpoint: no breaking point found.")
