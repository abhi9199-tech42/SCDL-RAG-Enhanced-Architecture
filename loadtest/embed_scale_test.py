"""
Benchmark: embedding service (/classify) vs API gateway (/v1/detect)
200 unique requests, 10 concurrent threads, measuring throughput + p50/p95.
"""
import time, json, random, statistics, string
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

EMBED_URL = "http://127.0.0.1:4096"
API_URL = "http://127.0.0.1:8001"
AUTH_HEADER = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}
N = 200
CONCURRENCY = 10

TOPICS = [
    ("Photosynthesis converts sunlight into chemical energy using chlorophyll.", "energy conversion in plants"),
    ("The Eiffel Tower was built in 1889 and stands in Paris, France.", "French landmark construction"),
    ("Python is a high-level programming language created by Guido van Rossum.", "programming language design"),
    ("The speed of light in vacuum is approximately 299,792,458 meters per second.", "physics fundamental constant"),
    ("Machine learning is a subset of artificial intelligence focused on pattern recognition.", "AI subfield definition"),
    ("Water freezes at 0 degrees Celsius and boils at 100 degrees Celsius at sea level.", "water phase changes"),
    ("The human genome contains approximately 3 billion base pairs of DNA.", "genetic information storage"),
    ("Shakespeare wrote 37 plays and 154 sonnets during his literary career.", "Elizabethan literature output"),
    ("Mars is the fourth planet from the Sun and has two small moons.", "solar system planets"),
    ("The Great Wall of China stretches over 13,000 miles across northern China.", "ancient fortification scale"),
]


def gen_classify_pairs(count=N):
    pairs = []
    for i in range(count):
        topic = random.choice(TOPICS)
        a = f"{topic[0]} (sample {i})"
        b = f"{topic[1]} (variant {i})"
        pairs.append([a, b])
    return pairs


def gen_detect_payloads(count=N):
    payloads = []
    for i in range(count):
        topic = random.choice(TOPICS)
        q = f"What is {topic[1]}? (query {i})"
        a = f"{topic[0]} (answer {i})"
        doc = {"id": f"doc{i}", "content": f"{topic[0]} (document {i})"}
        payloads.append({"question": q, "answer": a, "documents": [doc]})
    return payloads


def benchmark_classify(pairs):
    results = []
    errors = 0

    def do_one(pair):
        nonlocal errors
        t0 = time.time()
        try:
            r = requests.post(f"{EMBED_URL}/classify", json={"pairs": [pair]}, timeout=60)
            lat = (time.time() - t0) * 1000
            if r.status_code == 200:
                return {"ok": True, "latency_ms": lat}
            else:
                errors += 1
                return {"ok": False, "latency_ms": lat}
        except Exception as e:
            errors += 1
            return {"ok": False, "latency_ms": (time.time() - t0) * 1000}

    t_start = time.time()
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futures = [ex.submit(do_one, p) for p in pairs]
        for f in as_completed(futures):
            r = f.result()
            if r["ok"]:
                results.append(r["latency_ms"])
    elapsed = time.time() - t_start
    return results, errors, elapsed


def benchmark_detect(payloads):
    results = []
    errors = 0

    def do_one(payload):
        nonlocal errors
        t0 = time.time()
        try:
            r = requests.post(f"{API_URL}/v1/detect", headers=AUTH_HEADER,
                              json=payload, timeout=60)
            lat = (time.time() - t0) * 1000
            if r.status_code == 200:
                return {"ok": True, "latency_ms": lat}
            else:
                errors += 1
                return {"ok": False, "latency_ms": lat}
        except Exception as e:
            errors += 1
            return {"ok": False, "latency_ms": (time.time() - t0) * 1000}

    t_start = time.time()
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futures = [ex.submit(do_one, p) for p in payloads]
        for f in as_completed(futures):
            r = f.result()
            if r["ok"]:
                results.append(r["latency_ms"])
    elapsed = time.time() - t_start
    return results, errors, elapsed


def report(label, latencies, errors, elapsed):
    n = len(latencies)
    throughput = n / elapsed if elapsed > 0 else 0
    latencies.sort()
    p50 = statistics.median(latencies) if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if len(latencies) >= 20 else (latencies[-1] if latencies else 0)
    avg = statistics.mean(latencies) if latencies else 0

    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    print(f"  Requests:       {n} succeeded / {n + errors} total")
    print(f"  Errors:         {errors}")
    print(f"  Duration:       {elapsed:.2f}s")
    print(f"  Throughput:     {throughput:.1f} req/s")
    print(f"  Avg latency:    {avg:.0f} ms")
    print(f"  P50 latency:    {p50:.0f} ms")
    print(f"  P95 latency:    {p95:.0f} ms")
    print(f"{'='*60}\n")

    return {"throughput": throughput, "p50": p50, "p95": p95, "avg": avg, "errors": errors, "duration": elapsed}


if __name__ == "__main__":
    print("=" * 60)
    print("  Embedding Service Scale Test")
    print("  Concurrency: 10 threads, 200 requests each endpoint")
    print("=" * 60)

    # Generate unique data
    pairs = gen_classify_pairs(N)
    detect_payloads = gen_detect_payloads(N)

    # --- Test 1: Direct embedding /classify ---
    print("\n[Warm-up] 2 pings to /classify...")
    requests.post(f"{EMBED_URL}/classify", json={"pairs": [["warm", "up"]]}, timeout=30)
    requests.post(f"{EMBED_URL}/classify", json={"pairs": [["warm", "up"]]}, timeout=30)

    print(f"\n[Benchmark] /classify — {N} requests, {CONCURRENCY} threads")
    lat_c, err_c, dur_c = benchmark_classify(pairs)
    r1 = report("EMBEDDING SERVICE — /classify (port 4096, 4 threads)", lat_c, err_c, dur_c)

    # --- Test 2: API server /v1/detect ---
    print("[Warm-up] 2 pings to /v1/detect...")
    requests.post(f"{API_URL}/v1/detect", headers=AUTH_HEADER,
                  json={"question": "warm", "answer": "up", "documents": [{"id": "w", "content": "warmup"}]}, timeout=30)
    requests.post(f"{API_URL}/v1/detect", headers=AUTH_HEADER,
                  json={"question": "warm", "answer": "up2", "documents": [{"id": "w2", "content": "warmup2"}]}, timeout=30)

    print(f"\n[Benchmark] /v1/detect — {N} requests, {CONCURRENCY} threads")
    lat_d, err_d, dur_d = benchmark_detect(detect_payloads)
    r2 = report("API GATEWAY — /v1/detect (port 8001, via embedding service)", lat_d, err_d, dur_d)

    # --- Summary ---
    print(f"\n{'='*60}")
    print(f"  SCALE TEST SUMMARY")
    print(f"{'='*60}")
    print(f"  {'Endpoint':<45} {'Req/s':>8} {'P50(ms)':>8} {'P95(ms)':>8} {'Err':>4}")
    print(f"  {'-'*45} {'-'*8} {'-'*8} {'-'*8} {'-'*4}")
    print(f"  {'Embedding /classify (4 thr)':<45} {r1['throughput']:>8.1f} {r1['p50']:>8.0f} {r1['p95']:>8.0f} {r1['errors']:>4}")
    print(f"  {'API /v1/detect (via embed)':<45} {r2['throughput']:>8.1f} {r2['p50']:>8.0f} {r2['p95']:>8.0f} {r2['errors']:>4}")
    print(f"{'='*60}")
    print("Done.")
