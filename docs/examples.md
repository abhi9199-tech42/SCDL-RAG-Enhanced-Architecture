# Examples

## Legal Document Checking

```python
from scdl_rag import Client

client = Client(api_key="sk_live_...")

result = client.detect(
    question="What precedent does Smith v. Jones set for negligence cases?",
    answer="Smith v. Jones established that emotional distress damages require physical injury.",
    documents=[{
        "id": "case_law_123",
        "content": "Smith v. Jones (2019) held that emotional distress damages do not require accompanying physical injury when the defendant acted with reckless indifference."
    }]
)

if result.hallucination_detected:
    print(f"LEGAL ALERT: Citation hallucination detected!")
    print(f"Explanation: {result.explanation}")
    print(f"Actual ruling says: emotional distress does NOT require physical injury")
```

## Medical Record Verification

```python
result = client.detect(
    question="Is metformin safe for patients with renal impairment?",
    answer="Metformin is safe for patients with GFR above 30 mL/min.",
    documents=[{
        "id": "uptodate_456",
        "content": "Metformin is contraindicated when GFR falls below 30 mL/min. Use with caution at 30-45 mL/min. Reduce dose by 50% if GFR 30-45."
    }]
)

if result.hallucination_detected:
    print("MEDICAL ALERT: Wrong dosage recommendation!")
    print("Evidence says: contraindicated below 30, caution and dose reduction at 30-45")
```

## Financial Data Validation

```python
result = client.detect(
    question="What was Q2 2024 revenue for Acme Corp?",
    answer="Acme Corp reported $2.1 billion in Q2 2024 revenue.",
    documents=[{
        "id": "sec_filing_789",
        "content": "Acme Corp Q2 2024 Revenue: $1.89 billion, up 3.2% YoY. Net income: $342 million."
    }]
)

if result.hallucination_detected:
    print(f"FINANCIAL ALERT: Revenue hallucination!")
    print(f"Actual revenue: $1.89B, not $2.1B")
```

## Auto-Fix in Action

```python
result = client.detect_and_fix(
    question="What is gradient descent?",
    answer="gradient descent is the workhorse optimization algorithm in machine learning",
    documents=[{
        "id": "doc1",
        "content": "Neural networks have nodes called neurons that process information..."
    }],
    document_pool=[
        {"id": "doc2", "content": "Gradient descent is the workhorse optimization algorithm in machine learning. You compute the gradient and take steps in the opposite direction."},
        {"id": "doc3", "content": "Cooking is both an art and a science involving the Maillard reaction."}
    ],
    auto_fix=True
)

if result.fix_success:
    print(f"Auto-fixed! mu: {result.mu_score_initial:.4f} -> {result.mu_score_after_fix:.4f}")
    print(f"Found evidence: {result.evidence_snippet[:80]}...")
```

## Batch Processing (High Volume)

```python
cases = [
    {"id": "q1", "question": "What is X?", "answer": "X is Y", "documents": [...]},
    {"id": "q2", "question": "What is Z?", "answer": "Z is W", "documents": [...]},
]

batch_result = client.batch_detect_and_fix(cases, auto_fix=True)
print(f"{batch_result.summary['hallucinations_found']} hallucinations found")
print(f"{batch_result.summary['fixes_successful']} auto-fixed")
print(f"Accuracy improved: {batch_result.summary['accuracy_improvement']}")
```
