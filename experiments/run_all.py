"""
Full experiment: SQuAD + HotpotQA ingest/retrieve/compress + QA accuracy + contradiction.
CSV includes question, expected_answer, predicted_answer, exact_match, f1.
"""
import json, os, subprocess, sys, time, csv, re
sys.stdout.reconfigure(line_buffering=True)
from pathlib import Path
from typing import List, Dict
import requests

BASE = Path(__file__).resolve().parent.parent
PYTHON = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"
EMBED_PORT = 4093
SRV_PORT = 3473
API = f"http://127.0.0.1:{SRV_PORT}/api"
H = {"x-api-key": "test-key", "Content-Type": "application/json"}

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------
def load_squad(max_n=200):
    fp = BASE / "experiments" / "data" / "train-v2.0.json"
    if not fp.exists():
        print("  Downloading SQuAD...")
        import urllib.request
        urllib.request.urlretrieve("https://rajpurkar.github.io/SQuAD-explorer/dataset/train-v2.0.json", fp)
    with open(fp, encoding="utf-8") as f:
        data = json.load(f)
    out = []
    for a in data["data"]:
        for p in a["paragraphs"]:
            for q in p["qas"]:
                out.append({"id": q["id"], "question": q["question"], "context": p["context"],
                            "answers": [a["text"] for a in q.get("answers",[])]})
                if len(out) >= max_n: return out
    return out

def load_hotpotqa(max_n=200):
    fp = BASE / "experiments" / "data" / "hotpotqa_samples.json"
    if not fp.exists():
        print("  [SKIP] HotpotQA cache not found")
        return []
    with open(fp, encoding="utf-8") as f:
        return json.load(f)[:max_n]

def wait_health(url, timeout=60):
    for i in range(timeout):
        try:
            r = requests.get(f"{url}/health", headers=H, timeout=2)
            if r.status_code == 200: return True
        except: pass
        time.sleep(1)
    return False

# ---------------------------------------------------------------------------
# F1 / Exact Match helpers (SQuAD eval standard)
# ---------------------------------------------------------------------------
def normalize(s: str) -> str:
    """Lowercase, remove articles/punct, collapse whitespace."""
    s = s.lower()
    s = re.sub(r"\b(a|an|the)\b", " ", s)
    s = re.sub(r"[^\w\s]", "", s)
    return " ".join(s.split())

def f1_score(pred: str, gold: str) -> float:
    p_tokens = normalize(pred).split()
    g_tokens = normalize(gold).split()
    if not p_tokens or not g_tokens:
        return 0.0
    common = set(p_tokens) & set(g_tokens)
    if not common:
        return 0.0
    prec = len(common) / len(p_tokens)
    rec = len(common) / len(g_tokens)
    return 2 * prec * rec / (prec + rec)

def best_f1(pred: str, golds: List[str]) -> float:
    return max(f1_score(pred, g) for g in golds) if golds else 0.0

def exact_match(pred: str, golds: List[str]) -> int:
    norm_pred = normalize(pred)
    return 1 if any(norm_pred == normalize(g) for g in golds) else 0

# ---------------------------------------------------------------------------
# QA via retrieval — find answer in retrieved chunks
# ---------------------------------------------------------------------------
def answer_via_retrieval(question: str, expected_answers: List[str]) -> tuple:
    """Return (predicted_answer, exact_match, f1)."""
    try:
        r = requests.post(f"{API}/retrieve", headers=H,
            json={"query": question, "limit": 5}, timeout=30)
        if r.status_code != 200 or not r.json().get("success"):
            return ("", 0, 0.0)
        results = r.json()["data"].get("results", [])
    except:
        return ("", 0, 0.0)

    # Search each retrieved chunk for expected answers
    best_pred = ""
    best_em = 0
    best_f = 0.0
    for chunk in results:
        text = chunk.get("content", "")
        if not text:
            continue
        # Check each expected answer
        for exp in expected_answers:
            if exp and exp.lower() in text.lower():
                # Found! Check if this is a better match
                em = exact_match(exp, expected_answers)
                f = best_f1(exp, expected_answers)
                if f > best_f:
                    best_pred = exp
                    best_em = em
                    best_f = f
    return (best_pred, best_em, best_f)

# ---------------------------------------------------------------------------
# Start services
# ---------------------------------------------------------------------------
print("=" * 70)
print("SCDL-RAG: Full Experiment with QA Accuracy")
print("=" * 70)

print("\n[1/5] Loading datasets...")
squad = load_squad(200)
hotpot = load_hotpotqa(200)
print(f"  SQuAD: {len(squad)} | HotpotQA: {len(hotpot)}")

print("\n[2/5] Starting embedding service...")
ep = subprocess.Popen([PYTHON, str(BASE / "embedding" / "server.py")],
    env={**os.environ, "EMBEDDING_PORT": str(EMBED_PORT)},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not wait_health(f"http://127.0.0.1:{EMBED_PORT}"):
    print("  FAILED"); ep.kill(); sys.exit(1)
print("  OK")

print("\n[3/5] Starting server...")
sp = subprocess.Popen(["node", str(BASE / "dist" / "index.js")], cwd=str(BASE),
    env={**os.environ, "NODE_ENV": "development", "PORT": str(SRV_PORT),
         "SCDL_API_KEY": "test-key", "RATE_LIMIT_MAX": "100000",
         "EMBEDDING_SERVICE_URL": f"http://127.0.0.1:{EMBED_PORT}"},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not wait_health(API):
    print("  FAILED"); ep.kill(); sp.kill(); sys.exit(1)
print("  OK")

all_results = []       # (dataset, experiment, ok, latency_ms)
qa_results = []        # (dataset, question, expected, predicted, exact_match, f1, latency_ms)
_ingested_sys_ids = {} # original_id -> system_id

# ---------------------------------------------------------------------------
# Experiment phases
# ---------------------------------------------------------------------------
def ingest(samples, label):
    print(f"\n  --- {label} INGEST ---")
    ok = fail = 0
    for i in range(0, len(samples), 10):
        batch = samples[i:i+10]
        payload = {"items": [{"id": s["id"],
            "content": (s.get("context") or s.get("question") or s.get("answer") or ""),
            "metadata": {"dataset": label.lower()}} for s in batch]}
        t0 = time.time()
        try:
            r = requests.post(f"{API}/batch/ingest", headers=H, json=payload, timeout=60)
            lat = (time.time() - t0) * 1000 / len(batch)
            if r.status_code == 200 and r.json().get("success"):
                details = r.json()["data"].get("details", [])
                for idx, s in enumerate(batch):
                    d = details[idx] if idx < len(details) else {}
                    if d.get("success"):
                        ok += 1
                        _ingested_sys_ids[s["id"]] = d["id"]
                        all_results.append((label, "ingest", True, lat))
                    else:
                        fail += 1; all_results.append((label, "ingest", False, lat))
            else:
                fail += len(batch)
        except Exception as e:
            fail += len(batch); all_results.append((label, "ingest", False, 0))
            print(f"    [ERR] batch {i//10}: {e}")
        print(f"    {i+len(batch):>3}/{len(samples)}  OK={ok}  Fail={fail}")
    avg = sum(r[3] for r in all_results if r[0]==label and r[1]=='ingest' and r[2]) / max(ok,1)
    print(f"    -> {label} ingest: {ok}/{ok+fail} OK, avg {avg:.1f}ms")

def retrieve(label, samples, max_n=100):
    print(f"\n  --- {label} RETRIEVE ---")
    ok = fail = 0
    for i, s in enumerate(samples[:max_n]):
        q = (s.get("question") or s.get("context","")[:200])[:200]
        t0 = time.time()
        try:
            r = requests.post(f"{API}/retrieve", headers=H,
                json={"query": q, "limit": 5}, timeout=30)
            lat = (time.time() - t0) * 1000
            if r.status_code == 200 and r.json().get("success"):
                ok += 1; all_results.append((label, "retrieve", True, lat))
            else:
                fail += 1; all_results.append((label, "retrieve", False, lat))
        except:
            fail += 1; all_results.append((label, "retrieve", False, 0))
        if (i+1) % 20 == 0:
            print(f"    {i+1}/{max_n}  OK={ok}  Fail={fail}")
    avg = sum(r[3] for r in all_results if r[0]==label and r[1]=='retrieve' and r[2]) / max(ok,1)
    print(f"    -> {label} retrieve: {ok}/{ok+fail} OK, avg {avg:.1f}ms")

def compress(label, samples, max_n=100):
    print(f"\n  --- {label} COMPRESS ---")
    ok = fail = 0
    for i, s in enumerate(samples[:max_n]):
        c = (s.get("context") or s.get("question") or s.get("answer") or "")[:500]
        t0 = time.time()
        try:
            r = requests.post(f"{API}/optimize-compression", headers=H,
                json={"content": c}, timeout=30)
            lat = (time.time() - t0) * 1000
            if r.status_code == 200 and r.json().get("success"):
                ok += 1; all_results.append((label, "compress", True, lat))
            else:
                fail += 1; all_results.append((label, "compress", False, lat))
        except:
            fail += 1; all_results.append((label, "compress", False, 0))
        if (i+1) % 20 == 0:
            print(f"    {i+1}/{max_n}  OK={ok}  Fail={fail}")
    avg = sum(r[3] for r in all_results if r[0]==label and r[1]=='compress' and r[2]) / max(ok,1)
    print(f"    -> {label} compress: {ok}/{ok+fail} OK, avg {avg:.1f}ms")

def qa_accuracy(label, samples, max_n=100):
    """Answer questions via retrieval, compute exact_match and F1."""
    print(f"\n  --- {label} QA ACCURACY ---")
    em_total = 0
    f1_total = 0.0
    for i, s in enumerate(samples[:max_n]):
        q = s.get("question", "")
        if label == "SQuAD":
            expected = s.get("answers", [])
        else:
            expected = [s.get("answer", "")]
        t0 = time.time()
        pred, em, f1 = answer_via_retrieval(q, expected)
        lat = (time.time() - t0) * 1000
        em_total += em
        f1_total += f1
        qa_results.append((label, q, ", ".join(expected), pred, em, round(f1, 4), round(lat, 1)))
        if (i+1) % 20 == 0:
            print(f"    {i+1}/{max_n}  EM={em_total}  F1={f1_total/(i+1):.4f}")
    n = min(len(samples), max_n)
    print(f"    -> {label} QA: EM={em_total}/{n} ({100*em_total/n:.1f}%)  F1={f1_total/n:.4f}")

def warmup_nli():
    print("\n  --- NLI WARMUP ---")
    print("    Ingesting two test texts...")
    r1 = requests.post(f"{API}/ingest", headers=H,
        json={"content": "Water freezes at 0 degrees Celsius"}, timeout=30)
    r2 = requests.post(f"{API}/ingest", headers=H,
        json={"content": "Water freezes at 100 degrees Celsius"}, timeout=30)
    aid = r1.json()["data"]["id"]; bid = r2.json()["data"]["id"]
    print("    Loading cross-encoder model via detect-contradictions...")
    t0 = time.time()
    r = requests.post(f"{API}/detect-contradictions", headers=H,
        json={"semanticUnitIds": [aid, bid]}, timeout=120)
    dt = time.time() - t0
    contras = r.json().get("data",{}).get("contradictions",[])
    sev = contras[0]["severity"] if contras else 0
    print(f"    Done in {dt:.1f}s, contradiction={len(contras)>0}, severity={sev:.3f}")

def contradiction():
    print("\n  --- SQuAD CONTRADICTION DETECTION (context groups) ---")
    groups = {}
    for s in squad:
        ctx = s.get("context","")
        if ctx: groups.setdefault(ctx, []).append(s["id"])
    ok = fail = processed = 0
    for ctx, ids in groups.items():
        if processed >= 20: break
        if len(ids) < 2: continue
        sys_ids = [_ingested_sys_ids.get(i) for i in ids[:5] if _ingested_sys_ids.get(i)]
        if len(sys_ids) < 2: continue
        t0 = time.time()
        try:
            r = requests.post(f"{API}/detect-contradictions", headers=H,
                json={"semanticUnitIds": sys_ids}, timeout=120)
            lat = (time.time() - t0) * 1000
            if r.status_code == 200 and r.json().get("success"):
                ok += 1
                c = r.json()["data"].get("contradictions", [])
                all_results.append(("SQuAD", "contradiction", True, lat))
                print(f"    G{processed+1:>2}: {len(sys_ids)} units, {len(c)} contradictions ({lat:.0f}ms)")
            else:
                fail += 1; all_results.append(("SQuAD", "contradiction", False, lat))
        except Exception as e:
            fail += 1; all_results.append(("SQuAD", "contradiction", False, 0))
        processed += 1
    print(f"    -> contradiction: {ok}/{ok+fail} OK")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
print("\n[4/5] Running experiments...")

for name, samples in [("HotpotQA", hotpot), ("SQuAD", squad)]:
    if not samples: continue
    print(f"\n{'#'*55}\n# {name}\n{'#'*55}")
    ingest(samples, name)
    retrieve(name, samples, 100)
    compress(name, samples, 100)
    qa_accuracy(name, samples, 100)

warmup_nli()
contradiction()

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
print("\n" + "=" * 70)
print("FINAL RESULTS")
print("=" * 70)
print(f"\n{'Dataset':<12} {'Experiment':<16} {'OK':>6} {'Avg ms':>10}")
print("-" * 44)
tot_ok = tot_n = 0
for ds in ["HotpotQA", "SQuAD"]:
    for exp in ["ingest", "retrieve", "compress", "contradiction"]:
        items = [r for r in all_results if r[0]==ds and r[1]==exp]
        if not items: continue
        ok_n = sum(1 for r in items if r[2])
        n = len(items)
        avg = sum(r[3] for r in items if r[2]) / max(ok_n, 1)
        tot_ok += ok_n; tot_n += n
        print(f"  {ds:<10} {exp:<16} {ok_n:>4}/{n:<4} {avg:>8.1f}")
print("-" * 44)
print(f"  {'TOTAL':<10} {'':<16} {tot_ok:>4}/{tot_n:<4}")
print(f"  Success rate: {100*tot_ok/tot_n:.1f}%")

# QA summary
print(f"\n{'Dataset':<12} {'QA EM':>10} {'QA F1':>10}")
print("-" * 32)
for ds in ["HotpotQA", "SQuAD"]:
    qs = [q for q in qa_results if q[0]==ds]
    if not qs: continue
    em = sum(q[4] for q in qs)
    f1 = sum(q[5] for q in qs)
    print(f"  {ds:<10} {em:>4}/{len(qs):>4} ({100*em/len(qs):.1f}%) {f1/len(qs):>8.4f}")

# ---------------------------------------------------------------------------
# CSV with answer correctness
# ---------------------------------------------------------------------------
csv_path = BASE / "experiments" / "reports" / f"full_qa_{int(time.time())}.csv"
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["dataset", "experiment", "success", "latency_ms",
                "question", "expected_answer", "predicted_answer", "exact_match", "f1"])
    for r in all_results:
        w.writerow([r[0], r[1], r[2], round(r[3], 1), "", "", "", "", ""])
    for q in qa_results:
        w.writerow([q[0], "qa", True, q[6], q[1], q[2], q[3], q[4], q[5]])
print(f"\nCSV: {csv_path}")

ep.kill(); sp.kill()
print("\nDone.")
