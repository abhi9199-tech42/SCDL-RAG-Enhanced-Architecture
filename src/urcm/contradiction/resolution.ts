import { Contradiction, ResolutionStrategy } from '../types';

export interface ResolutionEngine {
  resolve(contradictions: Contradiction[]): Promise<ResolutionStrategy[]>;
}

export class StandardResolutionEngine implements ResolutionEngine {
  async resolve(contradictions: Contradiction[]): Promise<ResolutionStrategy[]> {
    return contradictions.map(c => this.determineStrategy(c));
  }

  private determineStrategy(c: Contradiction): ResolutionStrategy {
    // 1. Truth Maintenance (High confidence vs Low confidence)
    // We assume we don't have the full node objects here, so we rely on severity/type
    if (c.severity > 0.8 && c.type === 'factual') {
      return {
        contradictionId: c.id,
        action: 'deprecate', // Deprecate the lower confidence one (abstractly)
        confidence: 0.9,
        reasoning: "High severity factual conflict resolved by Truth Maintenance."
      };
    }

    // 2. Context Split (Semantic opposition)
    if (c.type === 'semantic') {
      return {
        contradictionId: c.id,
        action: 'split',
        confidence: 0.85,
        reasoning: "Semantic opposition indicates distinct contexts."
      };
    }

    // 3. Uncertainty Weighting (Low confidence/severity)
    return {
      contradictionId: c.id,
      action: 'flag',
      confidence: 0.6,
      reasoning: "Low severity conflict; applying uncertainty weighting."
    };
  }
}
