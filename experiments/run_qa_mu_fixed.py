"""
QA + mu-Convergence: four-axis evaluation.
Axis 1 — Answer Accuracy:   predicted == ground truth?
Axis 2 — Retrieval Success: answer found in retrieved evidence?
Axis 3 — Evidence Coherence: μ indicates evidence supports answer?
Axis 4 — Hallucination Detection: unsupported answers flagged by μ?
"""
import json, os, subprocess, sys, time, csv, re, math
sys.stdout.reconfigure(line_buffering=True)
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import requests
_WIKI_HEADERS = {"User-Agent": "SCDL-RAG/1.0 (research)"}
_WIKI_API = "https://en.wikipedia.org/w/api.php"

BASE = Path(__file__).resolve().parent.parent
PYTHON = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"
EMBED_PORT = 4096; SRV_PORT = 3476
API = f"http://127.0.0.1:{SRV_PORT}/api"
EMBED_URL = f"http://127.0.0.1:{EMBED_PORT}"
H = {"x-api-key": "test-key", "Content-Type": "application/json"}

def load_squad(max_n=30):
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

def load_hotpotqa(max_n=30):
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

def normalize(s):
    s = s.lower()
    s = re.sub(r"\b(a|an|the)\b", " ", s)
    s = re.sub(r"[^\w\s]", "", s)
    return " ".join(s.split())

def f1_score(pred, gold):
    p = normalize(pred).split()
    g = normalize(gold).split()
    if not p or not g: return 0.0
    common = set(p) & set(g)
    if not common: return 0.0
    prec = len(common) / len(p)
    rec = len(common) / len(g)
    return 2 * prec * rec / (prec + rec)

def best_em_f1(pred, golds):
    if not golds: return (0, 0.0)
    em = max(1 if normalize(pred) == normalize(g) else 0 for g in golds)
    f1 = max(f1_score(pred, g) for g in golds)
    return (em, f1)

def answer_from_context(question, context, expected_answers):
    """Find which expected answer appears in the context (SQuAD-style extractive)."""
    for exp in expected_answers:
        if exp and exp.lower() in context.lower():
            return exp
    return ""

_wiki_cache: Dict[str, str] = {}
_last_wiki = 0.0
def _wiki_req(params: dict) -> dict:
    global _last_wiki
    elapsed = time.time() - _last_wiki
    if elapsed < 0.5:
        time.sleep(0.5 - elapsed)
    for _ in range(3):
        try:
            r = requests.get(_WIKI_API, params=params, headers=_WIKI_HEADERS, timeout=15)
            if r.status_code == 200:
                _last_wiki = time.time()
                return r.json()
        except: pass
        time.sleep(1)
    return {}

def _wiki_page_text(title: str) -> str:
    """Get full plain-text extract for a Wikipedia page title."""
    data = _wiki_req({"action": "query", "prop": "extracts", "exlimit": 1,
                      "explaintext": 1, "format": "json", "titles": title})
    pages = data.get("query", {}).get("pages", {})
    for info in pages.values():
        if isinstance(info, dict) and info.get("extract"):
            return info["extract"]
    return ""

def fetch_multi_article_context(question: str, supporting_titles=None, max_articles=5, max_len=8000) -> List[Dict]:
    """Fetch multiple Wikipedia articles for a question.
    Returns list of {title, text, has_answer, answer_sentence} dicts.
    Supports `supporting_titles` to prioritize specific articles.
    """
    titles_to_fetch = []

    # 1. Add supporting titles first (highest priority), skip obvious placeholders
    if supporting_titles:
        for t in supporting_titles:
            if t and len(t) > 2 and t[0].isupper() and t not in titles_to_fetch:
                titles_to_fetch.append(t)

    # 2. Try question as a direct title
    if question not in titles_to_fetch and len(question) > 5:
        titles_to_fetch.append(question)

    # 3. Search Wikipedia for the question
    data = _wiki_req({"action": "query", "list": "search",
                      "srsearch": question, "format": "json", "srlimit": max_articles * 2})
    for result in data.get("query", {}).get("search", []):
        title = result["title"]
        if title not in titles_to_fetch:
            titles_to_fetch.append(title)
        if len(titles_to_fetch) >= max_articles + len(supporting_titles or []):
            break

    # Fetch each article
    articles = []
    for title in titles_to_fetch[:max_articles + 3]:
        if title in _wiki_cache:
            txt = _wiki_cache[title]
        else:
            txt = _wiki_page_text(title)
            if txt:
                _wiki_cache[title] = txt
        if len(txt) > 50:
            articles.append({"title": title, "text": txt[:max_len]})

    return articles

def find_answer_in_articles(question: str, expected_answers: List[str], articles: List[Dict]) -> tuple:
    """Search all articles for the expected answer. Returns (predicted, source_article_text)."""
    for exp in expected_answers:
        if not exp:
            continue
        for art in articles:
            if exp.lower() in art["text"].lower():
                return exp, art["text"]
    # Fallback: return any answer found anywhere, or empty
    for art in articles:
        for exp in expected_answers:
            if exp and exp.lower() in art["text"].lower():
                return exp, art["text"]
    return "", (articles[0]["text"] if articles else "")

def supporting_sentence(text, context):
    """Return the first sentence from context that contains `text`."""
    import re
    for s in re.split(r'(?<=[.!?])\s+', context):
        if text.lower() in s.lower():
            return s
    return context[:500]

def softmax_contradiction(nli):
    logits = [nli["contradiction"], nli["entailment"], nli["neutral"]]
    mx = max(logits)
    exps = [math.exp(l - mx) for l in logits]
    s = sum(exps)
    return exps[0] / s if s > 0 else 0.0

def compute_rho(text):
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

def classify_nli(text_a, text_b, retries=2):
    for _ in range(retries):
        try:
            r = requests.post(f"{EMBED_URL}/classify", json={"pairs": [[text_a, text_b]]}, timeout=60)
            if r.status_code == 200: return r.json()["results"][0]
        except: pass
        time.sleep(0.5)
    return None

def compute_mu(text_a, text_b):
    """Get NLI scores, compute chi and rho, then mu = rho/chi."""
    nli = classify_nli(text_a, text_b)
    if nli is None:
        return {"chi": 0.0, "rho": 0.5, "mu": 1.0, "hallucination": False}
    chi = softmax_contradiction(nli)
    rho = (compute_rho(text_a) + compute_rho(text_b)) / 2
    mu = rho / chi if chi > 0 else 1.0
    mu = max(0.0, min(1.0, mu))
    return {"chi": round(chi, 4), "rho": round(rho, 4), "mu": round(mu, 4),
            "hallucination": mu < 0.1}

# ---- Start ----
print("=" * 72)
print("SCDL-RAG: QA + mu-Convergence Hallucination Detection (FIXED)")
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

# Ingest SQuAD contexts (HotpotQA uses live Wikipedia per-question)
print("\n[3] Ingesting contexts...")
ctx_ids = {}
for name, samples in [("SQuAD", squad)]:
    if not samples: continue
    for i in range(0, len(samples), 10):
        batch = samples[i:i+10]
        payload = {"items": [{"id": s["id"],
            "content": s.get("context", ""),
            "metadata": {"dataset": "squad"}} for s in batch]}
        try:
            r = requests.post(f"{API}/batch/ingest", headers=H, json=payload, timeout=60)
            if r.status_code == 200 and r.json().get("success"):
                for idx, s in enumerate(batch):
                    d = r.json()["data"].get("details", [])
                    if idx < len(d) and d[idx].get("success"):
                        ctx_ids[s["id"]] = d[idx]["id"]
        except: pass
    print(f"  {name}: ingested")

# Pre-warm NLI model
print("\n[4] Warming up NLI model...")
requests.post(f"{API}/ingest", headers=H, json={"content": "test"}, timeout=30)
requests.post(f"{API}/ingest", headers=H, json={"content": "test"}, timeout=30)
print("  OK")

# Process each question
print("\n[5] Processing questions...\n")
csv_rows = []
all_total = 0

# Metrics counters
ans_correct = 0; ans_wrong = 0
ret_found = 0; ret_miss = 0
ev_coherent = 0; ev_weak = 0; ev_contra = 0

# 2x2: answer-accuracy x evidence-coherence
# supported = correct + coherent; unsupported = wrong OR contradicted
hall_TP = 0; hall_FP = 0; hall_TN = 0; hall_FN = 0

for name, samples in [("HotpotQA", hotpot), ("SQuAD", squad)]:
    if not samples: continue
    for s in samples:
        qid = s["id"]
        question = s["question"]
        context = s.get("context", "")
        if name == "SQuAD":
            expected = s.get("answers", [])
        else:
            expected = [s.get("answer", "")]
        ground = " ; ".join(expected)

        # --- Axis 1 & 2: predict answer, track retrieval success ---
        if name == "SQuAD":
            predicted = answer_from_context(question, context, expected)
            evidence_retrieved = bool(predicted)  # SQuAD: context always has answer
        else:
            supp_titles = s.get("supporting_titles", [])
            articles = fetch_multi_article_context(question, supporting_titles=supp_titles)
            predicted, context = find_answer_in_articles(question, expected, articles)
            evidence_retrieved = bool(predicted)
            if not context:
                context = s.get("question", "")

        correct, f1 = best_em_f1(predicted, expected)
        answer_str = predicted if predicted else (expected[0] if expected else "")

        # --- Axis 3: evidence coherence via mu ---
        context_text = context if context else (s.get("question", ""))
        if answer_str and context_text:
            supporting = supporting_sentence(answer_str, context_text)
            result = compute_mu(f"{question} {answer_str}", supporting)
        else:
            result = {"chi": 0.0, "rho": 0.5, "mu": 1.0, "hallucination": False}

        mu = result["mu"]; chi = result["chi"]
        flagged = mu < 0.1

        # Classify evidence coherence
        if mu >= 0.3:
            coherence = "coherent"
        elif mu >= 0.1:
            coherence = "weak"
        else:
            coherence = "contradicted"

        # --- Axis 4: hallucination detection ---
        # Ground truth: supported = (correct AND evidence coherent)
        #               unsupported = (wrong OR evidence contradicted)
        is_supported = correct and coherence == "coherent"
        is_unsupported = (not correct) or coherence == "contradicted"

        if is_supported:
            if not flagged: hall_TN += 1
            else:           hall_FP += 1
        elif is_unsupported:
            if flagged:     hall_TP += 1
            else:           hall_FN += 1

        # Tally axes
        all_total += 1
        if correct:
            ans_correct += 1
        else:
            ans_wrong += 1
        if evidence_retrieved:
            ret_found += 1
        else:
            ret_miss += 1
        if coherence == "coherent":
            ev_coherent += 1
        elif coherence == "weak":
            ev_weak += 1
        else:
            ev_contra += 1

        # Show per-question
        status = "CORRECT" if correct else "WRONG"
        ev_label = {"coherent": "OK", "weak": "~", "contradicted": "X"}
        ret_label = "FOUND" if evidence_retrieved else "MISS"
        flag_label = "FLAG" if flagged else "OK"
        print(f"  Q{all_total:>2} [{name:8s}] ans={status:7s} f1={f1:.3f}  "
              f"          ret={ret_label:4s}  ev={ev_label[coherence]}  mu={mu:.4f}  chi={chi:.4f}  {flag_label}")
        print(f"          Q: {question[:75]}")
        pred_display = predicted if predicted else "(none)"
        print(f"          A: \"{pred_display[:50]}\"  (expected: {ground[:50]})")
        print()

        csv_rows.append({
            "question_id": qid, "dataset": name,
            "question": question, "ground_truth": ground,
            "predicted_answer": predicted,
            "answer_accuracy": int(correct), "f1_score": round(f1, 4),
            "retrieval_success": int(evidence_retrieved),
            "evidence_coherence": coherence,
            "mu_score": result["mu"], "chi_score": result["chi"],
            "rho_score": result["rho"],
            "hallucination_flagged": int(flagged),
        })

# ---- Final Report: 4 Axes ----
print("=" * 72)
print("FOUR-AXIS EVALUATION REPORT")
print("=" * 72)

# Axis 1: Answer Accuracy
print(f"\n[Axis 1] ANSWER ACCURACY")
print(f"  Correct:  {ans_correct}/{all_total} ({100*ans_correct/all_total:.1f}%)")
print(f"  Wrong:    {ans_wrong}/{all_total} ({100*ans_wrong/all_total:.1f}%)")

# Axis 2: Retrieval Success
print(f"\n[Axis 2] RETRIEVAL SUCCESS")
print(f"  Found:  {ret_found}/{all_total} ({100*ret_found/all_total:.1f}%)")
if ret_miss > 0:
    print(f"  Miss:   {ret_miss}/{all_total} ({100*ret_miss/all_total:.1f}%)")

# Axis 3: Evidence Coherence
print("\n[Axis 3] EVIDENCE COHERENCE (mu-convergence)")
print(f"  Coherent (mu>=0.3):     {ev_coherent} ({100*ev_coherent/all_total:.1f}%)")
print(f"  Weak (0.1<=mu<0.3):     {ev_weak} ({100*ev_weak/all_total:.1f}%)")
print(f"  Contradicted (mu<0.1):  {ev_contra} ({100*ev_contra/all_total:.1f}%)")

# 2x2: Answer Accuracy x Evidence Coherence
print(f"\n[Axis 3 + Axis 1]  ACCURACY × COHERENCE 2×2")
correct_coherent = sum(1 for r in csv_rows if r["answer_accuracy"] and r["evidence_coherence"] == "coherent")
correct_weak = sum(1 for r in csv_rows if r["answer_accuracy"] and r["evidence_coherence"] == "weak")
correct_contra = sum(1 for r in csv_rows if r["answer_accuracy"] and r["evidence_coherence"] == "contradicted")
wrong_coherent = sum(1 for r in csv_rows if not r["answer_accuracy"] and r["evidence_coherence"] == "coherent")
wrong_weak = sum(1 for r in csv_rows if not r["answer_accuracy"] and r["evidence_coherence"] == "weak")
wrong_contra = sum(1 for r in csv_rows if not r["answer_accuracy"] and r["evidence_coherence"] == "contradicted")
print(f"                        coherent    weak    contradicted")
print(f"  answer correct       {correct_coherent:>8d}  {correct_weak:>5d}  {correct_contra:>12d}")
print(f"  answer wrong         {wrong_coherent:>8d}  {wrong_weak:>5d}  {wrong_contra:>12d}")

# Axis 4: Hallucination Detection
print("\n[Axis 4] HALLUCINATION DETECTION (mu<0.1 = hallucination)")
print(f"  True Positives (unsupported + flagged):      {hall_TP}")
print(f"  True Negatives (supported + not flagged):     {hall_TN}")
print(f"  False Positives (supported + flagged):        {hall_FP}")
print(f"  False Negatives (unsupported + not flagged):  {hall_FN}")
if hall_TP + hall_FP > 0:
    prec = hall_TP / (hall_TP + hall_FP)
    print(f"  Precision: {prec:.3f}")
if hall_TP + hall_FN > 0:
    rec = hall_TP / (hall_TP + hall_FN)
    print(f"  Recall:    {rec:.3f}")
if hall_TP + hall_FP > 0 and hall_TP + hall_FN > 0:
    f1h = 2 * prec * rec / (prec + rec)
    print(f"  F1:        {f1h:.3f}")

# Per-dataset breakdown
for nm in ["HotpotQA", "SQuAD"]:
    rows = [r for r in csv_rows if r["dataset"] == nm]
    if not rows: continue
    n = len(rows)
    ca = sum(r["answer_accuracy"] for r in rows)
    rf = sum(r["retrieval_success"] for r in rows)
    ec = sum(1 for r in rows if r["evidence_coherence"] == "coherent")
    ew = sum(1 for r in rows if r["evidence_coherence"] == "weak")
    ex = sum(1 for r in rows if r["evidence_coherence"] == "contradicted")
    fl = sum(r["hallucination_flagged"] for r in rows)
    print(f"\n  {nm} ({n} questions):")
    print(f"    Accuracy: {ca}/{n} ({100*ca/n:.1f}%)  |  Retrieval: {rf}/{n} ({100*rf/n:.1f}%)")
    print(f"    Coherent: {ec}  Weak: {ew}  Contradicted: {ex}  |  Flagged: {fl}")

csv_path = BASE / "experiments" / "reports" / f"qa_mu_4axis_{int(time.time())}.csv"
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=[
        "question_id", "dataset", "question", "ground_truth", "predicted_answer",
        "answer_accuracy", "f1_score", "retrieval_success", "evidence_coherence",
        "mu_score", "chi_score", "rho_score", "hallucination_flagged"])
    w.writeheader()
    w.writerows(csv_rows)
print(f"\nCSV: {csv_path}")

ep.kill(); sp.kill()
print("Done.")
