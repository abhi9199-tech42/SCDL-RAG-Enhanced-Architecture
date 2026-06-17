import { SemanticUnit } from '../types';

export interface VectorStore {
  add(unit: SemanticUnit): Promise<string>;
  search(queryVector: number[], limit?: number): Promise<SemanticUnit[]>;
  get(id: string): Promise<SemanticUnit | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  clear(): Promise<void>;
  close?(): Promise<void>;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  originalId?: string;
  confidence: number;
  reason?: string;
}

export interface DeduplicationEngine {
  checkDuplicate(unit: SemanticUnit): Promise<DeduplicationResult>;
  merge(newUnit: SemanticUnit, existingUnit: SemanticUnit): Promise<SemanticUnit>;
}
