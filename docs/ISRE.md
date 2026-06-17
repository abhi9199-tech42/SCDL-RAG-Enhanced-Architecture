# Intelligent Semantic Representation Engine (ISRE)

The ISRE is the core component responsible for transforming raw content into compact, semantically rich representations. It enables high-fidelity retrieval and contradiction detection by capturing the *intent* and *meaning* of data rather than just keywords.

## Key Features

### 1. Semantic Compression
ISRE uses NLP techniques to compress raw text into a dual representation:
- **Semantic Vector**: A high-dimensional vector capturing the latent meaning.
- **Intent Graph**: A structured graph (DAG) representing the logical flow and key concepts.

This compression achieves high ratios (typically >10x) while preserving semantic fidelity.

### 2. Intent Graph Construction
The Intent Graph is built by:
- Extracting key entities and concepts.
- identifying relationships between them.
- Assigning confidence scores to nodes and edges.
- Normalizing intents to a canonical form.

### 3. Multi-Language Support
ISRE is designed to be language-agnostic. The `MultiLanguageValidator` ensures that:
- Semantic representations are consistent across different languages.
- Cross-lingual retrieval is accurate.
- Semantic drift between translations is minimized.

### 4. Compression Optimization
The `CompressionOptimizer` analyzes content to determine the optimal compression strategy:
- Balances compression ratio with reconstruction quality.
- Adjusts parameters based on content type and domain.
- Provides metrics on information loss and semantic preservation.

## Usage

```typescript
import { ISREProcessor } from '../isre/processor';

const processor = new ISREProcessor();
const rawContent = {
  id: 'doc-1',
  content: 'The quick brown fox jumps over the lazy dog.',
  contentType: 'text',
  metadata: { language: 'en' }
};

const semantics = await processor.compressSemantics(rawContent);
console.log(semantics.id); // Unique semantic ID
console.log(semantics.semanticVector); // Vector representation
console.log(semantics.intentGraph); // Intent graph structure
```

## Architecture

- **`ISREProcessor`**: Main entry point. Orchestrates the pipeline.
- **`TextCompressor`**: Handles text-specific compression logic.
- **`GraphBuilder`**: Constructs the intent graph.
- **`MultiLanguageValidator`**: Validates cross-lingual consistency.
- **`CompressionOptimizer`**: Optimizes compression parameters.
