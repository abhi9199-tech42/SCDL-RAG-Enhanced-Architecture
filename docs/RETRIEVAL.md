# Retrieval & Storage System

This module handles the storage, indexing, and retrieval of semantic units. It implements "Intent-Aware Retrieval" to ensure that the retrieved context is relevant to the user's underlying goal.

## Key Features

### 1. Intent-Aware Retrieval
Unlike standard vector search, this engine considers the *intent graph* of the query:
- Matches against intent nodes in stored documents.
- Prioritizes results that share the same semantic goal.
- Filters out irrelevant matches that might be vector-similar but intent-dissimilar.

### 2. Context Assembly
The `ContextAssembler` constructs the final context window for the LLM:
- **Relevance Sorting**: Orders snippets by relevance score.
- **Deduplication**: Removes redundant information.
- **Token Management**: Ensures the context fits within the model's token limit.
- **Coherence Check**: Arranges snippets to maintain logical flow.

### 3. Vector Storage
The system supports pluggable storage backends:
- **`MemoryVectorStore`**: Fast, in-memory storage for testing and small datasets.
- **`FileVectorStore`**: Persistent storage using local files.
- **Extensible**: Interfaces defined for adding SQL (pgvector) or dedicated vector DBs (Qdrant, Pinecone).

### 4. Deduplication
The `DeduplicationManager` prevents redundant data ingestion:
- Checks for exact content matches.
- Checks for semantic duplicates (high vector similarity).
- Merges metadata for duplicate entries.

## Usage

```typescript
import { IntentAwareRetrievalEngine } from '../retrieval/engine';
import { FileVectorStore } from '../storage/file_store';

const store = new FileVectorStore('./data');
const engine = new IntentAwareRetrievalEngine(store);

// Query
const query = "What is the capital of France?";
const results = await engine.retrieve(query, {
  limit: 5,
  minScore: 0.7,
  includeMetadata: true
});

// Assembly
const context = await engine.assembleContext(results, 4000); // 4000 token limit
```

## Architecture

- **`IntentAwareRetrievalEngine`**: Core retrieval logic.
- **`VectorStore`**: Interface for storage backends.
- **`ContextAssembler`**: Formats retrieved data for LLMs.
- **`DeduplicationManager`**: Manages data uniqueness.
