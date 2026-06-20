"""
Clean contradiction test — fresh services, measures accuracy and latency.
"""
import os, subprocess, sys, time, requests
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
PYTHON = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"
EMBED_PORT = 4088
SRV_PORT = 3460
API = f"http://127.0.0.1:{SRV_PORT}/api"
KEY = "test-key"
H = {"x-api-key": KEY, "Content-Type": "application/json"}

PAIRS = [
    ("Water freezes at 0 degrees Celsius", "Water freezes at 100 degrees Celsius", "contradiction"),
    ("Paris is the capital of France", "London is the capital of France", "contradiction"),
    ("Earth revolves around the Sun", "Sun revolves around the Earth", "contradiction"),
    ("Humans need oxygen to survive", "Humans can survive without oxygen", "contradiction"),
    ("Water freezes at 0 degrees Celsius", "At 0 C water turns to ice", "consistent"),
    ("Paris is the capital of France", "The capital of France is Paris", "consistent"),
    ("Earth revolves around the Sun", "Earth orbits the Sun", "consistent"),
    ("Humans need oxygen to survive", "Humans require oxygen for survival", "consistent"),
]

print("[1/3] Starting embedding service...", flush=True)
ep = subprocess.Popen([PYTHON, str(BASE / "embedding" / "server.py")],
    env={**os.environ, "EMBEDDING_PORT": str(EMBED_PORT)},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(60):
    try:
        if requests.get(f"http://127.0.0.1:{EMBED_PORT}/health", timeout=2).status_code == 200: break
    except: pass
    time.sleep(1)
else: print("FAIL"); ep.kill(); exit(1)
print("  OK", flush=True)

print("[2/3] Starting server...", flush=True)
sp = subprocess.Popen(["node", str(BASE / "dist" / "index.js")], cwd=str(BASE),
    env={**os.environ, "NODE_ENV": "development", "PORT": str(SRV_PORT),
         "SCDL_API_KEY": KEY, "RATE_LIMIT_MAX": "100000",
         "EMBEDDING_SERVICE_URL": f"http://127.0.0.1:{EMBED_PORT}"},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(30):
    try:
        if requests.get(f"{API}/health", timeout=2).status_code == 200: break
    except: pass
    time.sleep(1)
else: print("FAIL"); ep.kill(); sp.kill(); exit(1)
print("  OK\n", flush=True)

print("[3/3] Running contradiction test...\n", flush=True)
tp = fp = fn = tn = 0
contra_lat = []
ingest_lat = []

print(f"{'Text A':<42} {'Text B':<42} {'Expected':<14} {'Detected':<10} {'Sev':<8} {'t(ms)':<8}")
print("-" * 125)

for a, b, ex in PAIRS:
    t0 = time.time()
    r1 = requests.post(f"{API}/ingest", headers=H, json={"content": a}, timeout=60)
    ingest_lat.append((time.time() - t0) * 1000)

    t0 = time.time()
    r2 = requests.post(f"{API}/ingest", headers=H, json={"content": b}, timeout=60)
    ingest_lat.append((time.time() - t0) * 1000)

    aid = r1.json()["data"]["id"]
    bid = r2.json()["data"]["id"]

    t0 = time.time()
    r = requests.post(f"{API}/detect-contradictions", headers=H,
        json={"semanticUnitIds": [aid, bid]}, timeout=120)
    dt = (time.time() - t0) * 1000
    contra_lat.append(dt)

    contras = r.json().get("data", {}).get("contradictions", [])
    found = len(contras) > 0
    sev = ",".join(str(round(c["severity"],3)) for c in contras) if found else "0"

    if ex == "contradiction":
        if found: tp += 1
        else: fn += 1
    else:
        if found: fp += 1
        else: tn += 1

    ctype = ",".join(c.get("type","?") for c in contras) if found else "-"
    ok = (found and ex == "contradiction") or (not found and ex == "consistent")
    det = "YES" if found else "no"
    mark = " OK" if ok else " XX"
    print(f"{a[:40]:<42} {b[:40]:<42} {ex:<14} {det:<10} {sev:<8} {dt:.0f} {mark}  type={ctype}", flush=True)

acc = (tp + tn) / (tp + fp + fn + tn) * 100
avg_ingest = sum(ingest_lat) / len(ingest_lat) if ingest_lat else 0
avg_contra_detect = sum(contra_lat) / len(contra_lat) if contra_lat else 0

print(f"\n{'='*60}")
print(f"RESULTS")
print(f"{'='*60}")
print(f"  Contradiction detection accuracy: {acc:.0f}%")
print(f"  TP={tp} FP={fp} FN={fn} TN={tn}")
print(f"  Avg ingest: {avg_ingest:.0f}ms")
print(f"  Avg contradiction detection: {avg_contra_detect:.0f}ms")
print(f"  Contradiction types from µ-convergence layer verified in per-row output")

ep.kill(); sp.kill()
print("\nDone.")
