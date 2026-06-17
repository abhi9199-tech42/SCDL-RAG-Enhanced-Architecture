import { ISREProcessor, URCMProcessor } from '../types';
import { VectorStore, DeduplicationEngine } from '../storage/types';
import { IntentAwareRetrievalEngine } from '../retrieval/engine';
import { ContextAssembler } from '../context/types';
import { AuditTrail } from '../audit/types';
import { SystemConfig } from '../config/types';
import { Express } from 'express';

export interface SCDLSystem {
  // Components
  config: SystemConfig;
  isreProcessor: ISREProcessor;
  urcmProcessor: URCMProcessor;
  vectorStore: VectorStore;
  deduplicationEngine: DeduplicationEngine;
  retrievalEngine: IntentAwareRetrievalEngine;
  contextAssembler: ContextAssembler;
  auditTrail: AuditTrail;
  apiServer: Express;

  // Lifecycle
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Status
  isHealthy(): boolean;
}
