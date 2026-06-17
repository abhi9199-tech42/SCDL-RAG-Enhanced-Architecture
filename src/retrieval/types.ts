import { SemanticUnit, IntentGraph } from '../types';

export interface RetrievalResult {
  unit: SemanticUnit;
  score: number; // Final combined score
  explanation: string;
  metrics: {
    vectorSimilarity: number;
    intentAlignment: number;
    structuralMatch: number;
  };
}

export interface RetrievalOptions {
  limit?: number;
  minScore?: number;
  includeExplanation?: boolean;
}

export interface RetrievalEngine {
  retrieve(query: string, intentGraph?: IntentGraph, options?: RetrievalOptions): Promise<RetrievalResult[]>;
}
