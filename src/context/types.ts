import { SemanticUnit } from '../types';
import { RetrievalResult } from '../retrieval/types';

export interface ContextAssemblyOptions {
  maxTokens: number;
  maxUnits?: number;
  prioritizeCoherence?: boolean; // If true, filter out units that reduce coherence
  coherenceThreshold?: number; // Minimum coherence score to accept a context (default 0.5)
  format?: 'text' | 'json';
}

export interface AssembledContext {
  content: string;
  usedUnits: SemanticUnit[];
  coherenceScore: number;
  tokenCountEstimate: number;
  warnings: string[];
}

export interface ContextAssembler {
  assemble(results: RetrievalResult[], options: ContextAssemblyOptions): Promise<AssembledContext>;
  validateCoherence(units: SemanticUnit[]): Promise<number>;
}
