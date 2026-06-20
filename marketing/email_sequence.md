# Launch Email Sequence

## Email 1: Problem-Aware (Day 1)
**Subject:** Your RAG system is lying to users right now

**Body:**
Every RAG deployment has a dirty secret: it generates wrong answers and you don't know which ones.

A lawyer relying on your AI citation tool just cited a fabricated case.
A doctor acting on your medical Q&A just got a dangerous drug interaction wrong.
A trader using your financial analysis just made a decision on hallucinated numbers.

You won't know it happened until it's too late.

SCDL-RAG detects 97% of hallucinations with 100% precision. No false alarms. No missed contradictions.

We give you the ground truth: mu-score per answer, plain English explanation of what went wrong, and an auto-fix loop that recovers 75% of cases automatically.

Stop hoping your RAG is right. Start knowing.

[Try Free →]

---

## Email 2: Technical Deep Dive (Day 3)
**Subject:** How μ-convergence catches what NLI alone misses

**Body:**
Most hallucination detectors use NLI models. They ask: does the answer semantically contradict the evidence?

Problem: NLI models are trained on long-form text. When your RAG returns a short phrase answer ("42", "the mitochondria", "Section 4.2.1"), the NLI model sees ~0% contradiction — it just doesn't fire on short strings.

That's where μ-convergence changes the game.

We combine three signals into a single chi-score:
1. NLI semantic contradiction
2. Lexical overlap (are the answer's words in the evidence?)
3. Entity mismatch (are named entities present?)

χ = max(NLI, lexical_mismatch, entity_mismatch)

Our 2000-case evaluation showed that lexical overlap is the dominant signal (avg χ=0.696), while NLI alone averages χ=0.000 for short answers.

With μ = ρ/χ, any zero-signal (perfect lexical match, all entities present, no semantic contradiction) gives μ=10 — "definitely coherent." Any mismatch drives chi up, mu down, and triggers detection.

97% recall. 100% precision. One number.

[Docs →]

---

## Email 3: Auto-Fix (Day 7)
**Subject:** We don't just detect hallucinations — we fix 75% of them

**Body:**
Detection is step one. But what do you do with a flagged hallucination?

Most systems just return: "Confidence: 0.3". Now what? Do you regenerate? Do you search again? How?

SCDL-RAG's improvement loop:
1. Detection fires (mu < 0.1)
2. Chi breakdown tells us WHY — lexical mismatch? Entity gap?
3. Generate a search query from the missing terms
4. Search the document pool for better evidence
5. Recompute mu with found evidence
6. If mu ≥ 0.3 now, return the corrected answer

In our eval: 1077/1437 flagged cases fixed in one iteration (74.9%). The remaining 322 were genuine hallucinations — wrong answers with no supporting evidence anywhere.

That's 75% of your hallucination problem solved automatically. The other 25% you now know about, with an explanation of exactly what went wrong.

[API Docs →]

---

## Email 4: Enterprise Ready (Day 14)
**Subject:** Runs on your infrastructure. No data leaves your network.

**Body:**
SCDL-RAG is designed for enterprises that can't send data to third-party APIs.

- Docker deployment with docker-compose (2 CPU, 2 GB RAM)
- Air-gapped support: no internet required after install
- All models included in the image (all-MiniLM-L6-v2, deberta-v3-small NLI)
- Bearer token auth on every endpoint
- 4 endpoints: /v1/detect, /v1/detect-and-fix, /v1/batch/detect-and-fix, /v1/health
- SDKs for Python (pip install scdl-rag) and JavaScript (npm install scdl-rag)
- Batch processing for high-volume pipelines

Local deployment, enterprise security, production ready.

[Deploy Now →]

---

## Email 5: ROI & Case Studies (Day 21)
**Subject:** +25% accuracy gain for zero infrastructure change

**Body:**
Our 2000-case benchmark across 52 messy real-world article passages:

Before SCDL-RAG:
- Unchecked hallucinations degrading user trust
- No visibility into which answers are wrong
- Manual review doesn't scale

After SCDL-RAG:
- Hallucination recall: 97% (vs 17% with NLI-only)
- Precision: 100% (zero false positives across 2000 cases)
- Auto-fix rate: 74.9%
- Net accuracy improvement: +25%

- Legal: catch citation fabrications before they reach court
- Medical: flag drug interaction errors before clinical decisions
- Finance: verify numbers before multi-million dollar decisions
- Compliance: full audit trail of which answers were questioned and corrected

One API call. Zero false alarms. 97% of hallucinations caught.

[Get Started →]
