"""
Simple SQuAD experiment — standalone, no NLI (contradiction skipped).
"""
import json, os, subprocess, sys, time, csv
sys.stdout.reconfigure(line_buffering=True)
from pathlib import Path
import requests

BASE = Path(__file__).resolve().parent.parent
PYTHON = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"
EMBED_PORT = 4091
SRV_PORT = 3471
API = f"http://127.0.0.1:{SRV_PORT}/api"
HEADERS = {"x-api-key": "test-key", "Content-Type": "application/json"}

# Load SQuAD
DATA_FILE = BASE / "experiments" / "data" / "train-v2.0.json"
if not DATA_FILE.exists():
    print("Downloading SQuAD...")
    import urllib.request
    url = "https://rajpurkar.github.io/SQuAD-explorer/dataset/train-v2.0.json"
    urllib.request.urlretrieve(url, DATA_FILE)
    print("  OK")

with open(DATA_FILE, encoding="utf-8") as f:
    raw = json.load(f)
samples = [{"id": qa["id"], "question": qa["question"], "context": p["context"],
            "answers": [a["text"] for a in qa.get("answers",[])]}
           for article in raw["data"]
           for p in article["paragraphs"]
           for qa in p["qas"]]
samples = samples[:200]
print(f"Loaded {len(samples)} SQuAD samples")

def wait_health(url, timeout=60):
    for i in range(timeout):
        try:
            r = requests.get(f"{url}/health", headers=HEADERS, timeout=2)
            if r.status_code == 200: return True
        except: pass
        time.sleep(1)
    return False

print("\n[1/3] Starting embedding service...", flush=True)
ep = subprocess.Popen(
    [PYTHON, str(BASE / "embedding" / "server.py")],
    env={**os.environ, "EMBEDDING_PORT": str(EMBED_PORT)},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not wait_health(f"http://127.0.0.1:{EMBED_PORT}"):
    print("FAILED"); ep.kill(); sys.exit(1)
print("  OK", flush=True)

print("[2/3] Starting server...", flush=True)
sp = subprocess.Popen(
    ["node", str(BASE / "dist" / "index.js")], cwd=str(BASE),
    env={**os.environ, "NODE_ENV": "development", "PORT": str(SRV_PORT),
         "SCDL_API_KEY": "test-key", "RATE_LIMIT_MAX": "100000",
         "EMBEDDING_SERVICE_URL": f"http://127.0.0.1:{EMBED_PORT}"},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not wait_health(API):
    print("FAILED"); ep.kill(); sp.kill(); sys.exit(1)
print("  OK\n", flush=True)

results = []
print("=" * 60)
print("SQuAD Experiments")
print("=" * 60)

# --- INGESTION ---
print("\n[INGESTION] Batch-ingesting 200 items...", flush=True)
ok = fail = 0
for i in range(0, len(samples), 10):
    batch = samples[i:i+10]
    payload = {"items": [{"id": s["id"], "content": s["context"][:500],
                          "metadata": {"dataset": "squad"}} for s in batch]}
    t0 = time.time()
    try:
        r = requests.post(f"{API}/batch/ingest", headers=HEADERS, json=payload, timeout=60)
        lat = (time.time() - t0) * 1000
        data = r.json()
        if r.status_code == 200 and data.get("success"):
            for d in data["data"].get("details", []):
                if d.get("success"):
                    ok += 1; results.append(("ingest", True, lat/len(batch)))
                else:
                    fail += 1; results.append(("ingest", False, lat/len(batch)))
        else:
            fail += len(batch)
            for s in batch: results.append(("ingest", False, lat/len(batch)))
    except Exception as e:
        fail += len(batch)
        for s in batch: results.append(("ingest", False, (time.time()-t0)*1000/len(batch)))
    if (i // 10 + 1) % 5 == 0:
        print(f"  {i+len(batch)}/{len(samples)} (OK={ok}, Fail={fail})", flush=True)

# --- RETRIEVAL ---
print("\n[RETRIEVAL] Querying 100 items...", flush=True)
rok = rfail = 0
for i, s in enumerate(samples[:100]):
    t0 = time.time()
    try:
        r = requests.post(f"{API}/retrieve", headers=HEADERS,
                          json={"query": s["question"][:200], "limit": 5}, timeout=30)
        lat = (time.time() - t0) * 1000
        if r.status_code == 200 and r.json().get("success"):
            rok += 1; results.append(("retrieve", True, lat))
        else:
            rfail += 1; results.append(("retrieve", False, lat))
    except:
        rfail += 1; results.append(("retrieve", False, (time.time()-t0)*1000))
    if (i + 1) % 50 == 0:
        print(f"  {i+1}/100 (OK={rok}, Fail={rfail})", flush=True)

# --- COMPRESSION ---
print("\n[COMPRESSION] Optimizing 100 items...", flush=True)
cok = cfail = 0
for i, s in enumerate(samples[:100]):
    t0 = time.time()
    try:
        r = requests.post(f"{API}/optimize-compression", headers=HEADERS,
                          json={"content": s["context"][:500]}, timeout=30)
        lat = (time.time() - t0) * 1000
        if r.status_code == 200 and r.json().get("success"):
            cok += 1; results.append(("compress", True, lat))
        else:
            cfail += 1; results.append(("compress", False, lat))
    except:
        cfail += 1; results.append(("compress", False, (time.time()-t0)*1000))
    if (i + 1) % 50 == 0:
        print(f"  {i+1}/100 (OK={cok}, Fail={cfail})", flush=True)

print("\n" + "=" * 60)
print("RESULTS")
print("=" * 60)
for exp in ["ingest", "retrieve", "compress"]:
    exp_results = [r for r in results if r[0] == exp]
    ok_n = sum(1 for r in exp_results if r[1])
    total = len(exp_results)
    lats = [r[2] for r in exp_results if r[1]]
    avg_lat = sum(lats) / len(lats) if lats else 0
    print(f"  {exp:<12} {ok_n:>4}/{total:<4} OK   avg {avg_lat:>7.1f}ms")

total_ok = sum(1 for r in results if r[1])
total = len(results)
print(f"\n  TOTAL       {total_ok:>4}/{total:<4} OK")
print(f"  Success rate: {100*total_ok/total:.1f}%")

csv_path = BASE / "experiments" / "reports" / f"squad_{int(time.time())}.csv"
with open(csv_path, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["experiment", "success", "latency_ms"])
    for exp, ok, lat in results:
        w.writerow([exp, ok, round(lat, 2)])
print(f"\nCSV: {csv_path}")

ep.kill(); sp.kill()
print("Done.")
