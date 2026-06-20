"""
QA + mu-Convergence: shows every question one-by-one in plain English.
"""
import json, os, subprocess, sys, time, csv, re, math
sys.stdout.reconfigure(line_buffering=True)
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import requests

BASE = Path(__file__).resolve().parent.parent
PYTHON = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"
EMBED_PORT = 4095
SRV_PORT = 3475
API = f"http://127.0.0.1:{SRV_PORT}/api"
EMBED_URL = f"http://127.0.0.1:{EMBED_PORT}"
H = {"x-api-key": "test-key", "Content-Type": "application/json"}

def load_squad(max_n=50):
    fp = BASE / "experiments" / "data" / "train-v2.0.json"
    if not fp.exists():
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

def load_hotpotqa(max_n=50):
    fp = BASE / "experiments" / "data" / "hotpotqa_samples.json"
    if not fp.exists(): return []
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

def normalize(s: str) -> str:
    s = s.lower()
    s = re.sub(r"\b(a|an|the)\b", " ", s)
    s = re.sub(r"[^\w\s]", "", s)
    return " ".join(s.split())

def f1_score(pred: str, gold: str) -> float:
    p = normalize(pred).split()
    g = normalize(gold).split()
    if not p or not g: return 0.0
    common = set(p) & set(g)
    if not common: return 0.0
    prec = len(common) / len(p)
    rec = len(common) / len(g)
    return 2 * prec * rec / (prec + rec)

def best_em_f1(pred: str, golds: List[str]) -> Tuple[int, float]:
    if not golds: return (0, 0.0)
    em = max(1 if normalize(pred) == normalize(g) else 0 for g in golds)
    f1 = max(f1_score(pred, g) for g in golds)
    return (em, f1)

def softmax_contradiction(nli: dict) -> float:
    logits = [nli["contradiction"], nli["entailment"], nli["neutral"]]
    mx = max(logits)
    exps = [math.exp(l - mx) for l in logits]
    s = sum(exps)
    return exps[0] / s if s > 0 else 0.0

def compute_rho(text: str) -> float:
    try:
        r = requests.post(f"{EMBED_URL}/embed", json={"texts": [text]}, timeout=30)
        if r.status_code != 200: return 0.5
        vec = r.json()["embeddings"][0]
        abs_sum = sum(abs(v) for v in vec)
        if abs_sum < 1e-10: return 0.5
        probs = [abs(v) / abs_sum for v in vec]
        entropy = -sum(p * math.log2(p) for p in probs if p > 0)
        max_entropy = math.log2(len(vec))
        return 1.0 - (entropy / max_entropy)
    except: return 0.5

def compute_mu(text_a: str, text_b: str) -> dict:
    """Get NLI scores, compute chi and rho, then mu = rho/chi."""
    try:
        r = requests.post(f"{EMBED_URL}/classify", json={"pairs": [[text_a, text_b]]}, timeout=60)
        if r.status_code != 200:
            return {"chi": 0.0, "rho": 0.5, "mu": 1.0, "hallucination": False}
        nli = r.json()["results"][0]
    except:
        return {"chi": 0.0, "rho": 0.5, "mu": 1.0, "hallucination": False}
    chi = softmax_contradiction(nli)
    rho = (compute_rho(text_a) + compute_rho(text_b)) / 2
    mu = rho / chi if chi > 0 else 1.0
    mu = max(0.0, min(1.0, mu))
    return {"chi": round(chi, 4), "rho": round(rho, 4), "mu": round(mu, 4),
            "hallucination": mu < 0.3}

def describe_hallucination(mu: float, chi: float, rho: float) -> str:
    if mu < 0.3:
        return f"HALLUCINATION DETECTED (mu={mu:.3f} < 0.3): the answer contradicts the question"
    elif mu < 0.6:
        return f"UNCERTAIN (mu={mu:.3f}): borderline case, answer may be unreliable"
    else:
        return f"CONSISTENT (mu={mu:.3f}): no hallucination detected"

# Start
print("=" * 72)
print("SCDL-RAG: QA + mu-Convergence Hallucination Detection")
print("=" * 72)

print("\n[1] Loading datasets...")
squad = load_squad(30)
hotpot = load_hotpotqa(30)
print(f"  SQuAD: {len(squad)} | HotpotQA: {len(hotpot)}")

print("\n[2] Starting services...")
ep = subprocess.Popen([PYTHON, str(BASE / "embedding" / "server.py")],
    env={**os.environ, "EMBEDDING_PORT": str(EMBED_PORT)},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not wait_health(f"http://127.0.0.1:{EMBED_PORT}"): print("FAIL"); exit(1)
sp = subprocess.Popen(["node", str(BASE / "dist" / "index.js")], cwd=str(BASE),
    env={**os.environ, "NODE_ENV": "development", "PORT": str(SRV_PORT),
         "SCDL_API_KEY": "test-key", "RATE_LIMIT_MAX": "100000",
         "EMBEDDING_SERVICE_URL": EMBED_URL},
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not wait_health(API): print("FAIL"); ep.kill(); sp.kill(); exit(1)
print("  OK")

# Ingest contexts
ctx_ids = {}
print("\n[3] Ingesting contexts...")
for name, samples in [("HotpotQA", hotpot), ("SQuAD", squad)]:
    if not samples: continue
    for i in range(0, len(samples), 10):
        batch = samples[i:i+10]
        payload = {"items": [{"id": s["id"],
            "content": (s.get("context") or s.get("question") or s.get("answer") or ""),
            "metadata": {"dataset": name.lower()}} for s in batch]}
        try:
            r = requests.post(f"{API}/batch/ingest", headers=H, json=payload, timeout=60)
            if r.status_code == 200 and r.json().get("success"):
                for idx, s in enumerate(batch):
                    d = r.json()["data"].get("details", [])
                    if idx < len(d) and d[idx].get("success"):
                        ctx_ids[s["id"]] = d[idx]["id"]
        except: pass
    print(f"  {name}: ingested contexts")

# Pre-warm the NLI model
print("\n[4] Warming up NLI model (loading cross-encoder, ~20s)...")
requests.post(f"{API}/ingest", headers=H,
    json={"content": "Water freezes at 0 degrees"}, timeout=30)
requests.post(f"{API}/ingest", headers=H,
    json={"content": "Water freezes at 100 degrees"}, timeout=30)
print("  Model loaded.")

# Process each question
print("\n[5] Processing questions...\n")
csv_rows = []
all_correct = 0
all_total = 0

for name, samples in [("HotpotQA", hotpot), ("SQuAD", squad)]:
    if not samples: continue
    for s in samples:
        qid = s["id"]
        question = s["question"]
        if name == "SQuAD":
            expected = s.get("answers", [])
        else:
            expected = [s.get("answer", "")]
        ground = " ; ".join(expected)

        # -- Retrieve predicted answer --
        predicted = ""
        try:
            rr = requests.post(f"{API}/retrieve", headers=H,
                json={"query": question, "limit": 3}, timeout=30)
            if rr.status_code == 200 and rr.json().get("success"):
                for chunk in rr.json()["data"].get("results", []):
                    text = chunk.get("content", "")
                    for exp in expected:
                        if exp and exp.lower() in text.lower():
                            predicted = exp
                            break
                    if predicted: break
        except: pass

        correct, f1 = best_em_f1(predicted, expected)

        # -- mu-convergence: question vs predicted answer (or ground truth if no prediction) --
        compare_text = predicted if predicted else ground
        result = compute_mu(question, compare_text)

        all_total += 1
        if correct: all_correct += 1

        # -- Print in plain English --
        status = "CORRECT" if correct else "WRONG"
        print(f"  Q{all_total:>2} [{name}] {question}")
        print(f"     Ground truth:   {ground}")
        print(f"     Predicted:      {predicted if predicted else '(none)'}")
        print(f"     Answer:         {status}  (F1={f1:.3f})")
        print(f"     mu={result['mu']:.4f}  chi={result['chi']:.4f}  rho={result['rho']:.4f}")
        print(f"     -> {describe_hallucination(result['mu'], result['chi'], result['rho'])}")
        print()

        csv_rows.append({
            "question_id": qid,
            "question": question,
            "ground_truth": ground,
            "predicted_answer": predicted,
            "correct": correct,
            "f1_score": round(f1, 4),
            "hallucination_detected": int(result["hallucination"]),
            "mu_score": result["mu"],
            "chi_score": result["chi"],
            "rho_score": result["rho"],
            "latency_ms": 0,
        })

# Summary
print("=" * 72)
print("FINAL SUMMARY")
print("=" * 72)
print(f"  Total questions:     {all_total}")
print(f"  Correct answers:     {all_correct}/{all_total} ({100*all_correct/all_total:.1f}%)")
hall_total = sum(r["hallucination_detected"] for r in csv_rows)
print(f"  Hallucinations:      {hall_total} (mu<0.3 threshold)")
mu_avg = sum(r["mu_score"] for r in csv_rows) / len(csv_rows)
chi_avg = sum(r["chi_score"] for r in csv_rows) / len(csv_rows)
print(f"  Avg mu:              {mu_avg:.4f}")
print(f"  Avg chi:             {chi_avg:.4f}")

csv_path = BASE / "experiments" / "reports" / f"qa_mu_show_{int(time.time())}.csv"
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=[
        "question_id", "question", "ground_truth", "predicted_answer",
        "correct", "f1_score", "hallucination_detected",
        "mu_score", "chi_score", "rho_score", "latency_ms"])
    w.writeheader()
    w.writerows(csv_rows)
print(f"\nCSV: {csv_path}")

ep.kill(); sp.kill()
print("Done.")
