# SCDL-RAG Python SDK
Detect and fix RAG hallucinations.

## Install
```bash
pip install scdl-rag
```

## Usage
```python
from scdl_rag import Client

client = Client(api_key="sk_live_...")

result = client.detect(
    question="What is RL?",
    answer="nodes called neurons",
    documents=[{"id": "doc1", "content": "RL is about..."}],
)

if result.hallucination_detected:
    print(f"Hallucination found: {result.explanation}")
else:
    print(f"Coherent (score: {result.mu_score})")
```

## API
See https://api.scdl-rag.com/docs for full API reference.
