# SCDL-RAG API

**Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning**

Detect and fix RAG hallucinations with **97% recall** and **100% precision**. A production-grade hallucination detection API that analyzes LLM answers against source documents using NLI-based multi-signal convergence (μ-score). Built for enterprise — Dockerized, async, load-tested.

[![PyPI](https://img.shields.io/badge/PyPI-scdl--rag-blue)](https://pypi.org/project/scdl-rag/)
[![npm](https://img.shields.io/badge/npm-scdl--rag-red)](https://www.npmjs.com/package/scdl-rag)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success)](https://abhi9199-tech42.github.io/SCDL-RAG-Enhanced-Architecture/)

---

## What It Does

SCDL-RAG detects when an LLM hallucinates by analyzing answers against source documents. It uses a **multi-signal μ-convergence engine** combining:

- **NLI (Natural Language Inference)** — cross-encoder model scores entailment/contradiction/neutral
- **Lexical overlap** — cosine similarity of embedding vectors
- **Entity alignment** — named entity consistency
- **Improvement loop** — when μ < 0.1, automatically searches for better evidence and re-evaluates

Each detection returns a human-readable explanation in plain English explaining why the answer is consistent or contradictory with the sources. For contradictory answers, the engine can suggest fixed alternatives.

### Detection Example

```
Input:
  Q: "What is the capital of France?"
  A: "London is the capital of France."
  Source: "Paris is the capital of France."

Output:
  hallucination_detected: true
  mu_score: 0.09
  explanation: "The premise states that Paris is the capital of France. The hypothesis says 'London is the capital of France.' This contradicts the premise which specifies Paris as the capital."
  signals: { nli: 0.01, lexical: 0.15, entity: 0.11, combined: 0.09 }
```

When hallucination is detected (μ < 0.1), the improvement loop searches for better evidence and can auto-fix **75%** of detected hallucinations.

---

## Benchmarks

| Metric | Value |
|--------|-------|
| **Recall** | **97%** (2000-case evaluation) |
| **Precision** | **100%** (no false positives) |
| **Auto-fix rate** | **75%** (improvement loop) |
| **Sync breaking point** | **12.3 req/s** per worker |
| **Batch sweet spot** | **67.4 cases/s** (batches of 8) |
| **Async throughput** | **55.1 tasks/s** (4 workers) |
| **30-min endurance** | **4473/4476 tasks** (99.93% success) |

---

## Quick Start

### Docker (recommended)

```bash
docker compose -f docker/docker-compose.yml up -d
# API: http://localhost:8888
```

### Python

```bash
pip install scdl-rag

from scdl_rag import Client
client = Client("http://localhost:8888", "sk_live_local_test")

result = client.detect(
    question="What is the capital of France?",
    answer="Paris",
    documents=[{"id": "d1", "content": "Paris is the capital of France."}]
)
print(result.hallucination_detected)  # False
print(result.mu_score)                # 0.88
```

### JavaScript

```bash
npm install scdl-rag

import { Client } from 'scdl-rag';
const client = new Client('http://localhost:8888', 'sk_live_local_test');
const result = await client.detect('What is the capital of France?', 'Paris', [{ id: 'd1', content: 'Paris is the capital of France.' }]);
```

### cURL

```bash
curl -X POST http://localhost:8888/v1/detect \
  -H "Authorization: Bearer sk_live_local_test" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the capital of France?",
    "answer": "Paris",
    "documents": [{"id": "d1", "content": "Paris is the capital of France."}]
  }'
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/health` | Health check with model status |
| `POST` | `/v1/detect` | Detect hallucination (single case) |
| `POST` | `/v1/detect/batch` | Batch detect (up to 100 cases) |
| `POST` | `/v1/detect-and-fix` | Detect + auto-fix with improvement loop |
| `POST` | `/v1/batch/detect-and-fix` | Batch detect-and-fix |
| `POST` | `/v1/async/detect` | Async enqueue detection task |
| `GET` | `/v1/async/result/{task_id}` | Poll async task result |

---

## Architecture

```
┌──────────┐     POST /v1/detect     ┌──────────┐     /classify     ┌────────────┐
│  Client  │ ──────────────────────►  │   API    │ ───────────────►  │ Embedding  │
│ (SDK)    │ ◄────────────────────── │  Server  │ ◄─────────────── │  Service   │
└──────────┘     JSON response       └──────────┘     JSON         └────────────┘
                                        │    ▲                        │
                                        │    │                        │
                                        ▼    │                        ▼
                                 ┌────────────┐              ┌──────────────┐
                                 │ μ-Engine    │              │ all-MiniLM   │
                                 │ multi-signal│              │ L6-v2 (emb)  │
                                 │ improvement │              │ nli-deberta  │
                                 │ loop        │              │ v3-small(NLI)│
                                 └────────────┘              └──────────────┘
```

- **Embedding service** (Flask + waitress, port 4096): loads all-MiniLM-L6-v2 for embeddings and cross-encoder/nli-deberta-v3-small for NLI classification
- **API server** (FastAPI + uvicorn, port 8000): 7 endpoints, 4 async worker threads, httpx connection pool (100 connections, HTTP/2)
- **Async queue**: thread-safe queue with 4 workers processes background detection tasks

---

## Demo

**[Live Demo →](https://abhi9199-tech42.github.io/SCDL-RAG-Enhanced-Architecture/)**

Landing page with live metrics, performance tables, and API reference. Served via GitHub Pages from the `docs/` directory.

---

## Docs

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/API.md)
- [Examples](docs/examples.md)
- [Deployment](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

---

## SDKs

| Language | Install | Docs |
|----------|---------|------|
| Python | `pip install scdl-rag` | [sdk/python/](sdk/python/) |
| JavaScript | `npm install scdl-rag` | [sdk/javascript/](sdk/javascript/) |

---

## Load Tests

See [loadtest/](loadtest/) for the full pressure-testing suite:
- Sync breaking point, batch benchmarking, async 4-worker
- 30-min endurance test (4476 tasks)
- 50-min comprehensive test (batch + async + sync mixed)
- All metrics, CSVs, and analysis scripts included

---

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).