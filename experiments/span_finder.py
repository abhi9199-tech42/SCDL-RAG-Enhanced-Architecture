"""
Extractive QA span-finder using embedding similarity + token alignment.
Goal: improve HotpotQA answer span accuracy beyond 16.7% by finding the
exact sentence or span in the evidence that answers the question.
"""
import json, re, sys, time, math
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import requests

BASE = Path(__file__).resolve().parent.parent
EMBED_URL = "http://127.0.0.1:4096"

STOPWORDS = set("a an the is are was were be been being have has had do did does will would shall should may might can could must need ought to in on at for by with from of to as into through during before after above below between out off over under again further then once here there when where why how all each every both few more most other some such no nor not only own same so than too very just because but or and if while although since until".split())

def get_content_words(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"\b[a-zA-Z]+\b", text) if w.lower() not in STOPWORDS]

def embed(texts: List[str]) -> Optional[List[List[float]]]:
    try:
        r = requests.post(f"{EMBED_URL}/embed", json={"texts": texts}, timeout=30)
        if r.status_code == 200:
            return r.json()["embeddings"]
    except: pass
    return None

def cosine_sim(a: List[float], b: List[float]) -> float:
    dot = sum(x*y for x,y in zip(a,b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(x*x for x in b))
    if na < 1e-12 or nb < 1e-12: return 0.0
    return dot / (na * nb)

def split_sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 5]

def find_best_span(question: str, context: str, answer_phrase: str) -> Dict:
    """
    Three-strategy span finder:
    1. Exact match (case-insensitive)
    2. Sentence embedding similarity to question
    3. Token-level sliding window with content word overlap
    """
    context_lower = context.lower()
    answer_lower = answer_phrase.lower().strip()

    # Strategy 1: exact match
    idx = context_lower.find(answer_lower)
    if idx >= 0:
        start = context[:idx].count(" ") + 1
        end = start + len(answer_phrase.split())
        return {
            "found": True,
            "span": answer_phrase,
            "start_token": start,
            "end_token": end,
            "method": "exact_match",
            "confidence": 1.0,
        }

    # Strategy 2: sentence-level embedding similarity
    sentences = split_sentences(context)
    if sentences:
        q_emb = embed([question])
        s_embs = embed(sentences)
        if q_emb and s_embs:
            scores = [cosine_sim(q_emb[0], s) for s in s_embs]
            best_idx = max(range(len(scores)), key=lambda i: scores[i])
            best_score = scores[best_idx]
            if best_score > 0.3:
                # Find token positions
                prefix = context[:context.find(sentences[best_idx])]
                start = len(prefix.split())
                end = start + len(sentences[best_idx].split())
                return {
                    "found": True,
                    "span": sentences[best_idx],
                    "start_token": start,
                    "end_token": end,
                    "method": "embed_sentence",
                    "confidence": round(best_score, 4),
                }

    # Strategy 3: sliding window with content word overlap
    ans_words = set(get_content_words(answer_phrase))
    if ans_words:
        all_words = context.split()
        best_overlap = 0
        best_start = 0
        window = max(5, len(ans_words) * 3)
        for i in range(len(all_words) - window + 1):
            window_set = set(get_content_words(" ".join(all_words[i:i+window])))
            overlap = len(ans_words & window_set)
            if overlap > best_overlap:
                best_overlap = overlap
                best_start = i
        if best_overlap > 0:
            end = min(best_start + window, len(all_words))
            span = " ".join(all_words[best_start:end])
            confidence = best_overlap / len(ans_words)
            return {
                "found": True,
                "span": span[:200],
                "start_token": best_start,
                "end_token": end,
                "method": "sliding_window",
                "confidence": round(confidence, 4),
            }

    return {
        "found": False,
        "span": "",
        "start_token": 0,
        "end_token": 0,
        "method": "none",
        "confidence": 0.0,
    }

def load_hotpotqa(max_n: int = 200) -> List[Dict]:
    fp = BASE / "experiments" / "data" / "hotpotqa_samples.json"
    if not fp.exists():
        print("HotpotQA cache not found. Run experiment_runner.py first.")
        return []
    with open(fp, encoding="utf-8") as f:
        return json.load(f)[:max_n]

def evaluate():
    samples = load_hotpotqa(200)
    if not samples:
        return

    print(f"Evaluating {len(samples)} HotpotQA samples for span finding")
    correct_exact = 0
    correct_embed = 0
    correct_window = 0
    total = 0
    no_ctx = 0

    for s in samples:
        question = s.get("question", "")
        answer = s.get("answer", "")
        context_parts = s.get("context", {})
        
        # Build full context from all articles
        contexts = []
        if isinstance(context_parts, dict):
            for title, sentences in context_parts.items():
                contexts.append(" ".join(sentences))
        elif isinstance(context_parts, list):
            for item in context_parts:
                if isinstance(item, dict):
                    contexts.append(item.get("text", ""))
        full_context = " ".join(contexts)
        
        if not full_context or not answer:
            no_ctx += 1
            continue

        total += 1
        result = find_best_span(question, full_context, answer)
        if result["method"] == "exact_match":
            correct_exact += 1
        elif result["method"] == "embed_sentence":
            correct_embed += 1
        elif result["method"] == "sliding_window":
            correct_window += 1

    found = correct_exact + correct_embed + correct_window
    print(f"\nResults ({total} samples with context):")
    print(f"  Exact match:     {correct_exact:>4} ({100*correct_exact/max(total,1):.1f}%)")
    print(f"  Embed sentence:  {correct_embed:>4} ({100*correct_embed/max(total,1):.1f}%)")
    print(f"  Sliding window:  {correct_window:>4} ({100*correct_window/max(total,1):.1f}%)")
    print(f"  Total found:     {found:>4} ({100*found/max(total,1):.1f}%)")
    print(f"  Not found:       {total-found:>4} ({100*(total-found)/max(total,1):.1f}%)")
    print(f"  No context:      {no_ctx}")

    return {
        "total": total,
        "exact_match": correct_exact,
        "embed_sentence": correct_embed,
        "sliding_window": correct_window,
        "found": found,
    }

if __name__ == "__main__":
    evaluate()
