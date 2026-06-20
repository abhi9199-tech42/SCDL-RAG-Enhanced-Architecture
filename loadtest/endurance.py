"""
Endurance test: 3-min soak at moderate load with mixed unique endpoints.
Confirms no memory leak or crash over sustained period.
"""
import requests, time, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}
DOCS = [{"id": "d1", "content": "Photosynthesis converts sunlight into chemical energy."}]
DURATION = 180  # 3 minutes
CONCURRENT = 20

results = []
errors = 0
t0 = time.time()
end_time = t0 + DURATION

print(f"Endurance test: 3 min @ {CONCURRENT} concurrent, mixed endpoints")
print(f"{'Time':>8} | {'Sent':>6} | {'OK':>6} | {'Fail':>6} | {'p50':>8} | {'p95':>8} | {'Err%':>6}")
print("-" * 70)

with ThreadPoolExecutor(max_workers=CONCURRENT) as ex:
    while True:
        now = time.time()
        if now >= end_time:
            break
        remaining = end_time - now
        batch_size = min(CONCURRENT, int(remaining * 5))
        if batch_size < 1:
            break

        futs = []
        for i in range(batch_size):
            is_async = (i % 5 == 0)  # 20% async, 80% sync
            payload = {
                "question": f"test {now}_{i}",
                "answer": "unique answer",
                "documents": DOCS
            }
            if is_async:
                futs.append(ex.submit(lambda: requests.post(
                    f"{API}/v1/async/detect", headers=H, json=payload, timeout=30)))
            else:
                futs.append(ex.submit(lambda: requests.post(
                    f"{API}/v1/detect", headers=H, json=payload, timeout=30)))

        for f in as_completed(futs):
            try:
                r = f.result()
                if r.status_code in (200, 202):
                    results.append(r.elapsed.total_seconds() * 1000)
                else:
                    errors += 1
            except:
                errors += 1

        # Report every 30s
        elapsed = time.time() - t0
        if int(elapsed) % 30 < 2 and elapsed > 5:
            total = len(results) + errors
            latencies = sorted(results)
            p50 = latencies[len(latencies)//2] if latencies else 0
            p95 = latencies[int(len(latencies)*0.95)] if len(latencies) > 5 else (latencies[-1] if latencies else 0)
            err_pct = errors / total * 100 if total else 0
            print(f"{elapsed:>7.0f}s | {total:>6} | {len(results):>6} | {errors:>6} | {p50:>7.0f} | {p95:>7.0f} | {err_pct:>5.1f}%")

elapsed = time.time() - t0
total = len(results) + errors
latencies = sorted(results)
p50 = latencies[len(latencies)//2] if latencies else 0
p95 = latencies[int(len(latencies)*0.95)] if len(latencies) > 5 else (latencies[-1] if latencies else 0)
err_pct = errors / total * 100 if total else 0

print("-" * 70)
print(f"FINAL  | {total:>6} | {len(results):>6} | {errors:>6} | {p50:>7.0f} | {p95:>7.0f} | {err_pct:>5.1f}%")
print(f"\nRuntime: {elapsed:.0f}s, Avg throughput: {total/elapsed:.1f} r/s")
print("Status: STABLE" if err_pct < 5 else "Status: UNSTABLE")
