"""
Mu-convergence engine (Python) — detects hallucinations via multi-signal chi.
μ = ρ / χ  where ρ = information density, χ = max(NLI, lexical_mismatch, entity_mismatch)
"""
import re, math, time
from typing import List, Tuple, Optional, Dict

STOPWORDS = set("a an the is are was were be been being have has had do did does will would shall should may might can could must need ought to in on at for by with from of to as into through during before after above below between out off over under again further then once here there when where why how all each every both few more most other some such no nor not only own same so than too very just because but or and if while although since until".split())

def get_content_words(text: str) -> List[str]:
    return [w for w in re.findall(r"\b[a-zA-Z]+\b", text.lower()) if w not in STOPWORDS]

def extract_entities(text: str) -> set:
    ents = set()
    for m in re.finditer(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text):
        ents.add(m.group().lower())
    for m in re.finditer(r"\b[A-Z]{2,}\b", text):
        ents.add(m.group().lower())
    return ents

def compute_rho(vector: List[float]) -> float:
    abs_sum = sum(abs(v) for v in vector)
    if abs_sum < 1e-12:
        return 0.0
    probs = [abs(v) / abs_sum for v in vector]
    entropy = -sum(p * math.log2(p) for p in probs if p > 0)
    max_entropy = math.log2(len(vector))
    return round(1.0 - (entropy / max_entropy), 4)

def compute_chi_nli(nli_result: Optional[Dict]) -> float:
    if not nli_result:
        return 0.0
    logits = [nli_result.get("contradiction", 0), nli_result.get("entailment", 0), nli_result.get("neutral", 0)]
    mx = max(logits)
    exps = [math.exp(l - mx) for l in logits]
    s = sum(exps)
    return exps[0] / s if s > 0 else 0.0

def compute_chi_lexical(answer: str, evidence: str) -> float:
    ans_words = get_content_words(answer)
    if not ans_words:
        return 0.0
    ev_set = set(get_content_words(evidence))
    missing = [w for w in ans_words if w not in ev_set]
    return len(missing) / len(ans_words)

def compute_chi_entity(answer: str, evidence: str) -> float:
    ans_ents = extract_entities(answer)
    if not ans_ents:
        return 0.0
    ev_ents = extract_entities(evidence)
    missing = sum(1 for e in ans_ents if e not in ev_ents)
    return missing / len(ans_ents)

def compute_chi_combined(answer: str, evidence: str, nli_result: Optional[Dict] = None) -> dict:
    chi_nli = compute_chi_nli(nli_result)
    chi_lex = compute_chi_lexical(answer, evidence)
    chi_ent = compute_chi_entity(answer, evidence)
    chi_combined = max(chi_nli, chi_lex, chi_ent)
    return {
        "nli": round(chi_nli, 4),
        "lexical": round(chi_lex, 4),
        "entity": round(chi_ent, 4),
        "combined": round(chi_combined, 4),
    }

def compute_mu(rho: float, chi: float) -> float:
    if chi <= 1e-12:
        return 10.0 if rho > 0 else 0.0
    if rho <= 1e-12:
        return 0.0
    return min(10.0, rho / chi)

def get_coherence_label(mu: float) -> str:
    if mu >= 0.3:
        return "coherent"
    elif mu >= 0.1:
        return "weak"
    else:
        return "contradicted"

def generate_explanation(answer: str, evidence: str, question: str, signals: dict, mu: float) -> str:
    parts = []
    if signals["nli"] > 0.5:
        parts.append(f"the NLI model finds semantic contradiction (score: {signals['nli']:.2f})")
    if signals["lexical"] > 0.3:
        ans_words = get_content_words(answer)
        ev_words = set(get_content_words(evidence))
        missing = [w for w in ans_words if w not in ev_words]
        if missing:
            parts.append(f"the answer uses words ({', '.join(missing[:5])}) not in the evidence")
    if signals["entity"] > 0.3:
        ans_ents = list(extract_entities(answer))
        if ans_ents:
            parts.append(f"entities ({', '.join(ans_ents[:3])}) in answer missing from evidence")
    if parts:
        return f"Answer '{answer}' to '{question}' contradicts evidence because: {'; '.join(parts)}. Evidence: '{evidence[:100]}...'"
    return f"Answer '{answer}' is consistent with the evidence (mu={mu:.4f})"

def generate_fix_suggestion(answer: str, question: str, signals: dict) -> dict:
    search_terms = []
    fix_type = "none"
    reason = "No fix needed"
    if signals["lexical"] > 0.3:
        search_terms = get_content_words(answer)
        fix_type = "lexical_mismatch"
        reason = f"Answer terms ({', '.join(search_terms[:5])}) not found in evidence"
    if signals["entity"] > 0.3:
        ents = list(extract_entities(answer))
        if ents:
            search_terms = ents
            fix_type = "entity_mismatch"
            reason = f"Entities ({', '.join(ents[:3])}) not found in evidence"
    if signals["nli"] > 0.5:
        search_terms = get_content_words(f"{question} {answer}")
        if fix_type == "none":
            fix_type = "nli_contradiction"
            reason = "NLI model indicates semantic contradiction"
    return {
        "fix_type": fix_type,
        "search_query": " ".join(search_terms) if search_terms else "",
        "missing_terms": search_terms[:10] if search_terms else [],
        "reason": reason,
    }

def search_evidence_pool(search_query: str, document_pool: List[dict]) -> Optional[dict]:
    query_words = set(get_content_words(search_query))
    if not query_words:
        return None
    best_doc = None
    best_score = 0
    for doc in document_pool:
        ev_words = set(get_content_words(doc.get("content", "")))
        overlap = len(query_words & ev_words)
        if overlap > best_score:
            best_score = overlap
            best_doc = doc
    return best_doc if best_score > 0 else None

def run_detection(answer: str, evidence: str, question: str, nli_result: Optional[Dict] = None,
                  rho_a: float = 0.05, rho_b: float = 0.05) -> dict:
    signals = compute_chi_combined(answer, evidence, nli_result)
    rho = (rho_a + rho_b) / 2 if rho_a and rho_b else 0.05
    mu = compute_mu(rho, signals["combined"])
    mu = max(0.0, min(1.0, round(mu, 4)))
    status = get_coherence_label(mu)
    explanation = generate_explanation(answer, evidence, question, signals, mu)
    fix_suggestion = generate_fix_suggestion(answer, question, signals)
    return {
        "mu_score": mu,
        "status": status,
        "signals": signals,
        "rho": rho,
        "explanation": explanation,
        "fix_suggestion": fix_suggestion,
    }

def run_improvement_loop(answer: str, question: str, documents: List[dict],
                         document_pool: List[dict], nli_result: Optional[Dict] = None,
                         rho_a: float = 0.05, rho_b: float = 0.05) -> dict:
    # First pass
    initial = run_detection(answer, documents[0]["content"] if documents else "",
                            question, nli_result, rho_a, rho_b)
    result = {
        "hallucination_detected": initial["status"] == "contradicted",
        "mu_score_initial": initial["mu_score"],
        "status_initial": initial["status"],
        "problem_detected": initial["fix_suggestion"],
        "explanation_initial": initial["explanation"],
        "fix_attempted": False,
        "fix_success": False,
    }
    if initial["status"] != "contradicted":
        result["mu_score"] = initial["mu_score"]
        result["status"] = initial["status"]
        result["explanation"] = initial["explanation"]
        return result
    # Fix: search for better evidence
    fix = initial["fix_suggestion"]
    if fix["fix_type"] == "none" or not fix["search_query"]:
        result["mu_score"] = initial["mu_score"]
        result["status"] = initial["status"]
        return result
    result["fix_attempted"] = True
    better_doc = search_evidence_pool(fix["search_query"], document_pool)
    if not better_doc:
        result["mu_score"] = initial["mu_score"]
        result["status"] = initial["status"]
        return result
    # Recompute with better evidence
    new_evidence = better_doc["content"]
    new_signals = compute_chi_combined(answer, new_evidence, nli_result)
    # Recompute rho with new evidence (use default rho since we don't have embeddings here)
    new_rho = 0.05
    new_mu = compute_mu(new_rho, new_signals["combined"])
    new_mu = max(0.0, min(1.0, round(new_mu, 4)))
    new_status = get_coherence_label(new_mu)
    new_explanation = generate_explanation(answer, new_evidence, question, new_signals, new_mu)
    result["fix_success"] = new_status == "coherent"
    result["mu_score_after_fix"] = new_mu
    result["status_after_fix"] = new_status
    result["evidence_source"] = better_doc.get("id", "unknown")
    result["evidence_snippet"] = new_evidence[:200]
    result["improved_answer"] = answer
    result["explanation"] = new_explanation
    result["confidence"] = 1.0
    return result
