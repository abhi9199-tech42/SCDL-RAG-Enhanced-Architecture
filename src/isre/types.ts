export interface SemanticPrimitive {
  id: string;
  concept: string;
  semanticWeight: number;
  modality: string;
  compressionMetadata: Record<string, any>;
}

export interface SemanticCompressor {
  readonly modality: string;
  compress(rawInput: any): Promise<SemanticPrimitive[]>;
}

export enum IntentType {
  GOAL = 'GOAL',
  QUERY = 'QUERY',
  CONSTRAINT = 'CONSTRAINT',
  EMOTION = 'EMOTION',
  CONTEXT = 'CONTEXT'
}

export enum EdgeType {
  TEMPORAL = 'TEMPORAL',
  CAUSAL = 'CAUSAL',
  ASSOCIATIVE = 'ASSOCIATIVE'
}
