# Unified $\mu$-Resonance Cognitive Mesh (URCM)

The URCM is the reasoning engine of the architecture. It goes beyond simple retrieval to understand how different pieces of information relate to each other, specifically focusing on identifying contradictions and reinforcing patterns ("resonance").

## Key Features

### 1. Contradiction Detection
URCM actively scans for contradictions between new content and existing knowledge:
- **Direct Contradictions**: Explicit logical conflicts (e.g., "A is true" vs "A is false").
- **Semantic Contradictions**: Conflicts in meaning or implication.
- **Temporal Contradictions**: Conflicts arising from outdated information.

### 2. Resonance Analysis
Resonance occurs when multiple independent sources confirm or reinforce a piece of information. URCM calculates a "Resonance Score" to estimate the reliability of information.

### 3. Resolution Strategies
When a contradiction is detected, URCM attempts to resolve it using configurable strategies:
- **`temporal`**: Prefer the most recent information.
- **`source_reliability`**: Prefer the source with higher trust score.
- **`consensus`**: Prefer the information supported by the majority of sources.
- **`manual`**: Flag for human review.

### 4. Attractor Dynamics
The "Attractor" concept models how information clusters around stable states. Strong attractors represent well-established facts, while weak attractors represent uncertain or debating points.

## Usage

```typescript
import { URCMProcessor } from '../urcm/processor';

const urcm = new URCMProcessor();
const newUnit = { ... }; // SemanticUnit
const existingContext = [ ... ]; // Array of SemanticUnits

const contradictions = await urcm.detectContradictions(newUnit, existingContext);

if (contradictions.length > 0) {
  const resolutions = await urcm.resolveContradictions(contradictions);
  console.log(resolutions);
}
```

## Architecture

- **`URCMProcessor`**: Main entry point.
- **`ContradictionDetector`**: Identifies logical and semantic conflicts.
- **`SemanticDetector`**: Uses deep learning models (simulated or integrated) for subtle meaning analysis.
- **`ResonanceEngine`**: Calculates resonance and stability scores.
- **`AttractorNetwork`**: Models information dynamics.
