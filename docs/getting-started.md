# Getting Started with SCDL-RAG

## Install

**Python:**
```bash
pip install scdl-rag
```

**JavaScript:**
```bash
npm install scdl-rag
```

## Get API Key

Visit [dashboard.scdl-rag.com/keys](https://dashboard.scdl-rag.com/keys) to get your API key.

## First Request

**Python:**
```python
from scdl_rag import Client

client = Client(api_key="sk_live_...")

result = client.detect(
    question="What color is the sky?",
    answer="The sky is green",
    documents=[{"id": "doc1", "content": "The sky is blue during the day and black at night."}]
)

print(result.hallucination_detected)  # True
print(result.explanation)  # "Answer 'The sky is green' contradicts evidence because..."
print(result.mu_score)     # 0.04 (mu < 0.1 = hallucination)
```

**JavaScript:**
```javascript
const { Client } = require('scdl-rag');

const client = new Client({ apiKey: 'sk_live_...' });

const result = await client.detect({
  question: 'What color is the sky?',
  answer: 'The sky is green',
  documents: [{ id: 'doc1', content: 'The sky is blue during the day and black at night.' }]
});

console.log(result.hallucinationDetected);  // true
console.log(result.explanation);
```

## Run Locally (Docker)

```bash
git clone https://github.com/yourusername/scdl-rag.git
cd scdl-rag
docker-compose -f docker/docker-compose.yml up -d
# API at http://localhost:8000
```

## Next Steps

- [API Reference](/docs/api.md)
- [Examples](/docs/examples.md)
- [Local Deployment](/docs/deployment.md)
- [Troubleshooting](/docs/troubleshooting.md)
