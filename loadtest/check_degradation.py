"""Check latency degradation over sustained load."""
import requests, time, statistics

API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}
DOCS = [{"id": "d1", "content": "Photosynthesis is how plants convert sunlight into chemical energy."}]

# Warm
requests.post(f"{API}/v1/detect", headers=H, json={"question":"w","answer":"t","documents":DOCS}, timeout=60)

lats1, lats2 = [], []
for i in range(50):
    t0 = time.time()
    r = requests.post(f"{API}/v1/detect", headers=H,
        json={"question":"What is photosynthesis?","answer":"plants convert sunlight","documents":DOCS}, timeout=30)
    lat = (time.time()-t0)*1000
    if i < 25:
        lats1.append(lat)
    else:
        lats2.append(lat)
    time.sleep(0.05)

p50_1 = statistics.median(lats1)
p50_2 = statistics.median(lats2)
deg = (p50_2 - p50_1) / p50_1 * 100
status = "[DEGRADATION]" if deg > 20 else "[stable]"
print(f"First 25: p50={p50_1:.0f}ms")
print(f"Second 25: p50={p50_2:.0f}ms")
print(f"Degradation: {deg:+.0f}% {status}")
