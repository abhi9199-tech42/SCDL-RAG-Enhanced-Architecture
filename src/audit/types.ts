export type DecisionType = 'retrieval' | 'contradiction_resolution' | 'context_assembly' | 'deduplication' | 'ingestion' | 'expert_review_completion' | 'content_ingestion';

export interface DecisionEvidence {
  factor: string;
  weight: number;
  description: string;
  sourceId?: string;
  value?: any;
  confidence?: number;
}

export interface DecisionRecord {
  id: string;
  timestamp: string;
  type: DecisionType;
  component: string;
  inputSummary: any;
  outcome: any;
  reasoning: string;
  evidence: DecisionEvidence[];
  confidence: number;
  metadata?: Record<string, any>;
}

export interface AuditTrail {
  logDecision(record: Omit<DecisionRecord, 'id' | 'timestamp'>): Promise<string>;
  getDecision(id: string): Promise<DecisionRecord | null>;
  getTrace(entityId: string): Promise<DecisionRecord[]>;
  getDecisionsByEntity(entityId: string): DecisionRecord[];
  generateExplanation(decisionId: string): Promise<string>;
}
