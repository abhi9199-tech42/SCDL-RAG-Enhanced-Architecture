"""
Small targeted tests: ingest ~50 SQuAD items, run retrieval/compression/contradiction,
inject known contradictory pairs to test μ-convergence with NLI.
Reports latency and contradiction findings.
"""
import json, os, subprocess, sys, time, requests
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
PYTHON = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"
EMBED_PORT = 4086
SERVER_PORT = 3458
API_BASE = f"http://127.0.0.1:{SERVER_PORT}/api"
API_KEY = "test-experiment-key-2024"
HEADERS = {"x-api-key": API_KEY, "Content-Type": "application/json"}

# --- Start services ---
def wait_for(url, timeout=60):
    for _ in range(timeout):
        try:
            if requests.get(url, timeout=2).status_code == 200: return True
        except: pass
        time.sleep(1)
    return False

print("[1] Starting embedding service...", flush=True)
ep = subprocess.Popen([PYTHON, str(BASE / "embedding" / "server.py")],
    env={**os.environ, "EMBEDDING_PORT": str(EMBED_PORT)},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not wait_for(f"http://127.0.0.1:{EMBED_PORT}/health", 60):
    print("  FAILED"); ep.kill(); sys.exit(1)
print("  OK", flush=True)

print("[2] Starting SCDL-RAG server...", flush=True)
sp = subprocess.Popen(["node", str(BASE / "dist" / "index.js")],
    cwd=str(BASE),
    env={**os.environ, "NODE_ENV": "development", "PORT": str(SERVER_PORT),
         "SCDL_API_KEY": API_KEY, "RATE_LIMIT_MAX": "100000",
         "EMBEDDING_SERVICE_URL": f"http://127.0.0.1:{EMBED_PORT}"},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not wait_for(f"{API_BASE}/health", 30):
    print("  FAILED"); ep.kill(); sp.kill(); sys.exit(1)
print("  OK\n", flush=True)

# --- Test 1: Ingest 50 SQuAD samples ---
print("=" * 70)
print("TEST 1: Ingest 50 SQuAD context paragraphs")
print("=" * 70)
squad_path = BASE / "experiments" / "data" / "train-v2.0.json"
squad = []
if squad_path.exists():
    with open(squad_path) as f:
        data = json.load(f)
    for article in data["data"]:
        for para in article["paragraphs"]:
            squad.append({"id": para["qas"][0]["id"], "context": para["context"]})
            if len(squad) >= 50: break
        if len(squad) >= 50: break

ingest_times = []
for i, item in enumerate(squad):
    t0 = time.time()
    r = requests.post(f"{API_BASE}/ingest", headers=HEADERS,
        json={"content": item["context"], "metadata": {"dataset": "SQuAD", "qid": item["id"]}}, timeout=60)
    t = (time.time() - t0) * 1000
    ingest_times.append(t)
    if i < 3 or i % 10 == 9:
        print(f"  [{i+1}/50] {t:.1f}ms {'OK' if r.ok else 'FAIL'}", flush=True)

avg = sum(ingest_times) / len(ingest_times)
print(f"\n  Ingestion: {len(ingest_times)} items, {avg:.1f}ms avg [{min(ingest_times):.1f}-{max(ingest_times):.1f}]")

# --- Test 2: Retrieve ---
print("\n" + "=" * 70)
print("TEST 2: Retrieve 20 queries")
print("=" * 70)
ret_times = []
for i, item in enumerate(squad[:20]):
    q = item["context"][:100]
    t0 = time.time()
    r = requests.post(f"{API_BASE}/retrieve", headers=HEADERS,
        json={"query": q, "limit": 3, "includeExplanation": True}, timeout=30)
    t = (time.time() - t0) * 1000
    ret_times.append(t)
    data = r.json()
    n = len(data.get("data", {}).get("results", []))
    print(f"  [{i+1}/20] {t:.1f}ms {n} results", flush=True)

avg = sum(ret_times) / len(ret_times)
print(f"\n  Retrieval: {len(ret_times)} queries, {avg:.1f}ms avg")

# --- Test 3: Compression ---
print("\n" + "=" * 70)
print("TEST 3: Compress 20 items")
print("=" * 70)
comp_times = []
for i, item in enumerate(squad[:20]):
    t0 = time.time()
    r = requests.post(f"{API_BASE}/optimize-compression", headers=HEADERS,
        json={"content": item["context"]}, timeout=30)
    t = (time.time() - t0) * 1000
    comp_times.append(t)
    print(f"  [{i+1}/20] {t:.1f}ms", flush=True)

avg = sum(comp_times) / len(comp_times)
print(f"\n  Compression: {len(comp_times)} items, {avg:.1f}ms avg")

# --- Test 4: μ-convergence contradiction detection ---
print("\n" + "=" * 70)
print("TEST 4: μ-convergence contradiction detection with NLI")
print("=" * 70)

contra_pairs = [
    ("Water freezes at 0 degrees Celsius", "Water freezes at 100 degrees Celsius", "contradiction"),
    ("Paris is the capital of France", "London is the capital of France", "contradiction"),
    ("The Earth revolves around the Sun", "The Sun revolves around the Earth", "contradiction"),
    ("Humans need oxygen to survive", "Humans can survive without oxygen", "contradiction"),
    ("Water freezes at 0 degrees Celsius", "At 0 degrees Celsius water turns to ice", "consistent"),
    ("Paris is the capital of France", "The capital of France is Paris", "consistent"),
    ("The Earth revolves around the Sun", "The Earth orbits the Sun", "consistent"),
    ("Humans need oxygen to survive", "Humans require oxygen for survival", "consistent"),
]

# Ingest pairs
ingested = []
for i, (a, b, label) in enumerate(contra_pairs):
    r1 = requests.post(f"{API_BASE}/ingest", headers=HEADERS, json={"content": a}, timeout=30)
    r2 = requests.post(f"{API_BASE}/ingest", headers=HEADERS, json={"content": b}, timeout=30)
    ingested.append((r1.json()["data"]["id"], r2.json()["data"]["id"], label, i))
    time.sleep(0.1)

tp = fp = fn = tn = 0
contra_times = []
print(f"\n{'A':<42} {'B':<42} {'Expected':<14} {'Hit':<4} {'Contra?':<8} {'Sev':<6} {'t(ms)':<6}")
print("-" * 125)
for aid, bid, expected, idx in ingested:
    a_text, b_text, _ = contra_pairs[idx]
    t0 = time.time()
    r = requests.post(f"{API_BASE}/detect-contradictions", headers=HEADERS,
        json={"semanticUnitIds": [aid, bid]}, timeout=60)
    t = (time.time() - t0) * 1000
    contra_times.append(t)
    data = r.json()
    contras = data.get("data", {}).get("contradictions", [])
    found = len(contras) > 0
    sev = round(contras[0]["severity"], 3) if found else 0
    if expected == "contradiction":
        if found: tp += 1
        else: fn += 1
    else:
        if found: fp += 1
        else: tn += 1
    hit = "OK" if (found and expected == "contradiction") or (not found and expected == "consistent") else "MISS"
    print(f"{a_text[:40]:<42} {b_text[:40]:<42} {expected:<14} {hit:<4} {'YES' if found else 'no':<8} {sev:<6} {t:.0f}", flush=True)

total = tp + fp + fn + tn
acc = (tp + tn) / total * 100 if total else 0
print(f"\n  TP={tp} FP={fp} FN={fn} TN={tn}  Accuracy: {acc:.0f}%")
print(f"  Contradiction detection: {sum(contra_times)/len(contra_times):.0f}ms avg")

# --- Summary ---
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"  Ingestion (50 items):        {sum(ingest_times)/len(ingest_times):.0f}ms avg")
print(f"  Retrieval (20 queries):       {sum(ret_times)/len(ret_times):.0f}ms avg")
print(f"  Compression (20 items):       {sum(comp_times)/len(comp_times):.0f}ms avg")
print(f"  μ-contradiction (8 pairs):    {sum(contra_times)/len(contra_times):.0f}ms avg")
print(f"  Contradiction accuracy:       {acc:.0f}%")

# Cleanup
ep.terminate(); sp.terminate()
try: ep.wait(3); sp.wait(3)
except: ep.kill(); sp.kill()
print("\nDone.")
