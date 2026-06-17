# SCDL-RAG Enhanced Architecture

**Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning**

A production-grade Retrieval-Augmented Generation (RAG) system that detects and resolves semantic contradictions before they reach the LLM context window. Traditional RAG retrieves *similar* content — this system retrieves *consistent* content.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-111%20passing-brightgreen.svg)]()

---

## The Problem

Standard RAG pipelines use cosine similarity to find relevant documents. This retrieves semantically *similar* text, but similarity does not equal consistency. Contradictory information gets injected into the LLM context, producing unreliable outputs.

```
Traditional RAG:
  Query: "Is aspirin safe during pregnancy?"
  Retrieved: "Aspirin is safe during pregnancy" + "Aspirin is dangerous during pregnancy"
  Result: Contradictory context → Unreliable LLM response

SCDL-RAG:
  Query: "Is aspirin safe during pregnancy?"
  Detects contradiction → Resolves via source authority
  Retrieved: "Aspirin should be avoided during third trimester" (verified, consistent)
  Result: Reliable, contradiction-free LLM response
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCDL-RAG Pipeline                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Raw Content ──► ISRE Compression ──► URCM Frequency Mapping   │
│                      │                        │                 │
│                      ▼                        ▼                 │
│              Intent Graphs          Contradiction Detection      │
│                      │                        │                 │
│                      ▼                        ▼                 │
│              Vector Storage ◄── μ-Convergence Resolution        │
│                      │                                          │
│                      ▼                                          │
│          Intent-Aware Retrieval ──► Context Assembly             │
│                                         │                       │
│                                         ▼                       │
│                                   LLM Generation                │
│                                         │                       │
│                                         ▼                       │
│                                  Audit Trail + Explainability   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Description |
|-----------|-------------|
| **ISRE** (Intentional Semantic Reasoning Engine) | Language-agnostic semantic compression into intent graphs (DAGs of concepts, relationships, conflict markers) |
| **URCM** (Unified μ-Resonance Cognitive Mesh) | Oscillatory dynamics using Kuramoto model for contradiction detection and resolution via phase synchronization |
| **Semantic Contradiction Detector** | Multi-layer detection: pairwise analysis, cluster-based, pattern-based (negation, temporal, causal, quantitative), domain-specific rules |
| **Resolution Engine** | Maps contradictions to strategies: truth maintenance, context split, uncertainty weighting |
| **Intent-Aware Retrieval** | Weighted scoring: 30% vector similarity + 70% intent alignment |
| **Explainable AI** | Decision chains, source traceability, confidence metrics, expert review queue |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.9 (strict mode) |
| API | Express 5.2 |
| Testing | Vitest + fast-check (property-based) |
| Validation | Zod 4.3 |
| Logging | Winston 3.11 |
| Python (Research) | Python 3.10+, Hypothesis, pytest, NumPy |

---

## Project Structure

```
├── src/                          # TypeScript production code
│   ├── types/                    # Core type definitions
│   ├── isre/                     # ISRE processor & compressors
│   │   ├── processor.ts          # Core ISRE processor
│   │   ├── compression/          # Text/code/multimodal compressors
│   │   │   ├── text.ts           # Text semantic compressor
│   │   │   └── optimizer.ts      # Adaptive compression optimizer
│   │   ├── graph/                # Intent graph builder
│   │   └── multilang/            # Multi-language validator
│   ├── urcm/                     # URCM processor & core
│   │   ├── processor.ts          # Core URCM processor
│   │   ├── core/                 # Mesh, resonance, attractor
│   │   │   ├── mesh.ts           # Kuramoto mesh network
│   │   │   ├── resonance.ts      # Resonance encoding
│   │   │   └── attractor.ts      # Attractor network
│   │   └── contradiction/        # Contradiction detection & resolution
│   │       ├── detector.ts       # Hybrid contradiction detector
│   │       ├── semantic_detector.ts  # Semantic contradiction detector
│   │       └── resolution.ts     # Resolution engine
│   ├── storage/                  # Vector storage & deduplication
│   ├── retrieval/                # Intent-aware retrieval engine
│   ├── context/                  # Context assembly system
│   ├── audit/                    # Audit trail & explainable AI
│   ├── config/                   # Configuration management
│   ├── system/                   # System core, performance, scaling
│   ├── api/                      # REST API server & routes
│   ├── utils/                    # Shared utilities
│   └── tests/                    # Test suite
│       ├── unit/                 # Unit tests
│       ├── integration/          # Integration tests
│       └── property_tests/       # Property-based tests (fast-check)
├── isre/                         # Python ISRE reference implementation
├── urcm/                         # Python URCM reference implementation
├── reference/                    # Original Python reference code
├── tests/                        # Python property-based tests
├── data/                         # Runtime data directory
├── docs/                         # Documentation
└── marketing/                    # Marketing materials
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+ (for property-based testing)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/abhi9199-tech42/SCDL-RAG-Enhanced-Architecture.git
cd SCDL-RAG-Enhanced-Architecture

# Install Node.js dependencies
npm install

# Install Python dependencies (for PBT)
pip install -r requirements-pbt.txt
```

### Build

```bash
npm run build
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Property-based tests only
npm run test:pbt

# Watch mode
npm run test:watch
```

### Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

### API Usage

**Ingest content:**
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "content": "Aspirin should be avoided during the third trimester of pregnancy.",
    "source": "medical-guidelines",
    "domain": "medical"
  }'
```

**Search with contradiction detection:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "query": "Is aspirin safe during pregnancy?",
    "limit": 5
  }'
```

**Health check:**
```bash
curl http://localhost:3000/api/health
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ingest` | Ingest content with semantic compression |
| `POST` | `/api/batch/ingest` | Batch ingest multiple documents |
| `POST` | `/api/search` | Search with intent-aware retrieval |
| `POST` | `/api/retrieve` | Retrieve relevant content |
| `POST` | `/api/contradictions/detect` | Detect contradictions in content |
| `POST` | `/api/consistency/validate` | Validate cross-lingual consistency |
| `GET` | `/api/health` | System health check |
| `GET` | `/api/metrics` | Performance metrics |
| `GET` | `/api/audit/trace/:id` | Get audit trace |
| `GET` | `/api/audit/explain/:id` | Get explanation for decision |
| `GET` | `/api/performance/metrics` | Detailed performance metrics |
| `POST` | `/api/explain/retrieval` | Explain retrieval decision |

---

## Testing Strategy

### Unit Tests
Targeted tests for individual components with specific inputs and expected outputs.

### Property-Based Tests (fast-check)
Automatically generates 100+ random inputs to verify universal correctness properties:
- Semantic compression determinism
- Cross-language consistency
- Contradiction detection completeness
- Resolution monotonicity
- Vector storage consistency
- Retrieval intent alignment

### Integration Tests
End-to-end pipeline tests verifying component interaction:
- Full ingestion → retrieval workflow
- Deduplication behavior
- Circuit breaker activation
- Multi-language validation
- Compression optimization

---

## Configuration

The system uses Zod-validated configuration with sensible defaults:

```typescript
{
  env: 'production',
  isre: {
    compressionThreshold: 0.7,
    maxSemanticUnits: 1000,
    graphDepth: 10
  },
  urcm: {
    convergenceThreshold: 0.01,
    maxIterations: 100,
    oscillationFrequency: 0.1
  },
  storage: {
    vectorDimension: 128,
    deduplicationThreshold: 0.95
  },
  retrieval: {
    maxResults: 10,
    intentWeight: 0.7,
    similarityWeight: 0.3
  }
}
```

---

## Security

- API key authentication (set `SCDL_API_KEY` environment variable)
- Input validation via Zod schemas
- Rate limiting support (configurable)
- CORS origin restriction
- Error message sanitization

---

## Roadmap

See [roadmapproduction.md](roadmapproduction.md) for the detailed production roadmap covering:
- Phase 1: Critical & Security Fixes
- Phase 2: Eliminate Mock/Random Data
- Phase 3: Code Quality & DRY
- Phase 4: Test Coverage
- Phase 5: Production Infrastructure
- Phase 6: Polish & Documentation

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript coding standards
4. Write tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Submit a pull request

---

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

This license requires that:
- Any derivative work must also be licensed under GPL v3
- Source code must be made available when distributing
- Changes must be documented
- No warranty is provided

---

## Citation

If you use this work in research, please cite:

```
SCDL-RAG Enhanced Architecture: Contradiction-Aware Retrieval 
for Reliable AI Reasoning. 2026.
```

---

## Acknowledgments

- Based on research into oscillatory dynamics for semantic reasoning
- Inspired by Kuramoto model for phase synchronization
- Property-based testing powered by fast-check and Hypothesis
