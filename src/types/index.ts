// Core Types for SCDL-RAG Enhanced Architecture

// --- Common Types ---

export interface SourceReference {
  sourceId: string;
  location: string; // e.g., "file.txt:L10-20" or "doc-id:page-3"
  contentSnippet?: string;
  metadata?: Record<string, any>;
}

export interface IntentNode {
  id: string;
  label: string;
  confidence: number;
  attributes: Record<string, any>;
  children?: IntentNode[];
  intentType?: string;
  semanticWeight?: number;
  weight?: number;
}

export interface SemanticRelation {
  sourceId: string;
  targetId: string;
  relationType: string;
  weight: number;
}

export interface IntentGraph {
  nodes: IntentNode[];
  edges: SemanticRelation[];
  rootIntent: string;
  confidenceScore: number;
}

export interface SemanticRepresentation {
  id: string;
  semanticVector: number[];
  intentNodes: IntentNode[];
  intentGraph?: IntentGraph;
  sourceReferences: SourceReference[];
  compressionRatio: number;
  languageAgnosticHash: string;
}

export interface SemanticUnit {
  id: string;
  content: string; // The textual or data representation
  semantics: SemanticRepresentation;
  sourceReferences: SourceReference[];
  metadata: Record<string, any>;
}

// --- ISRE Types ---

export interface RawContent {
  id: string;
  content: any;
  contentType: string; // 'text', 'image', 'audio', etc.
  language?: string;
  metadata?: Record<string, any>;
}

export interface QueryIntent {
  rawQuery: string;
  structuredIntent: IntentGraph;
  primaryIntent: string;
  entities: Record<string, any>;
  constraints: Record<string, any>;
}

export interface ISREProcessor {
  compressSemantics(rawData: RawContent): Promise<SemanticRepresentation>;
  constructIntentGraph(semantics: SemanticRepresentation): Promise<IntentGraph>;
  analyzeQueryIntent(query: string): Promise<QueryIntent>;
  traceToSource(semanticUnit: SemanticUnit): SourceReference[];
}

// --- URCM Types ---

export interface ResonancePattern {
  id?: string;
  frequency: number;
  amplitude: number;
  phase: number;
  sourceIds?: string[];
  semanticIds?: string[];
  stability?: number;
}

export interface FrequencyMapping {
  semanticFrequencies: Map<string, number>;
  resonancePatterns: ResonancePattern[];
  convergenceThreshold: number;
}

export interface ConvergenceEvidence {
  iterations: number;
  initialState: number;
  finalState: number;
  delta: number;
  stabilityMetric: number;
}

export interface Resolution {
  contradictionId: string;
  resolvedSemanticUnit?: SemanticUnit;
  convergenceEvidence?: ConvergenceEvidence;
  deterministicHash?: string;
  outcome?: 'resolved' | 'flagged' | 'split';
  confidence?: number;
  resonanceStability?: number;
  convergenceMetrics?: {
    iterations: number;
    finalError: number;
    stabilityScore: number;
  };
}

export interface CoherentContext {
  units: SemanticUnit[];
  coherenceScore: number;
  contradictionsResolved: number;
}

export interface Contradiction {
  id: string;
  sourceIds: string[];
  description: string;
  severity: number;
  type: ContradictionType;
  detectionConfidence: number;
  conflictingUnits?: SemanticUnit[];
  contradictionType?: ContradictionType;
  resolutionStrategy?: ResolutionStrategy;
}

export type ContradictionType = 'factual' | 'logical' | 'temporal' | 'sentiment' | 'semantic';
export type ResolutionStrategy = 'latest_wins' | 'source_authority' | 'consensus' | 'manual_review';

export interface URCMProcessor {
  mapToFrequencyDomain(semantics: SemanticRepresentation[]): Promise<FrequencyMapping>;
  detectResonance(mapping: FrequencyMapping): Promise<ResonancePattern[]>;
  applyMicroConvergence(contradictions: Contradiction[]): Promise<Resolution[]>;
  performOscillatoryReasoning(context: SemanticUnit[]): Promise<CoherentContext>;
}

// --- Contradiction Detection ---

export interface ConsistencyScore {
  score: number; // 0.0 to 1.0
  details: string;
}

export interface ExpertReviewItem {
  contradictionId: string;
  reason: string;
  context: any;
}

export interface ContradictionDetector {
  detectContradictions(semanticUnits: SemanticUnit[]): Promise<Contradiction[]>;
  analyzeSemanticConsistency(unit1: SemanticUnit, unit2: SemanticUnit): Promise<ConsistencyScore>;
  flagUnresolvableContradictions(contradictions: Contradiction[]): Promise<ExpertReviewItem[]>;
}

export interface Explanation {
  text: string;
  evidence: any[];
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface SemanticResolver {
  resolveContradiction(contradiction: Contradiction): Promise<Resolution>;
  validateResolution(resolution: Resolution): Promise<ValidationResult>;
  generateResolutionExplanation(resolution: Resolution): Promise<Explanation>;
}

// --- Storage ---

export interface StorageResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface DeduplicationResult {
  originalCount: number;
  deduplicatedCount: number;
  spaceSavings: number;
  mergedUnits: MergedSemanticUnit[];
}

export interface MergeOperation {
  timestamp: string;
  originalIds: string[];
  strategy: string;
}

export interface MergedSemanticUnit extends SemanticUnit {
  mergeHistory: MergeOperation[];
  consolidatedSemantics: SemanticRepresentation;
}

export interface OptimizationMetrics {
  storageUsed: number;
  indexSize: number;
  queryLatency: number;
}

export interface VectorStore {
  storeSemanticUnit(unit: SemanticUnit): Promise<StorageResult>;
  retrieveByIntent(intent: QueryIntent): Promise<SemanticUnit[]>;
  deduplicateSemantics(units: SemanticUnit[]): Promise<DeduplicationResult>;
  optimizeStorage(): Promise<OptimizationMetrics>;
}

// --- Retrieval ---

export interface RetrievalExplanation {
  unitId: string;
  score: number;
  reason: string;
}

export interface RankedResult {
  unit: SemanticUnit;
  score: number;
  rank: number;
}

export interface RetrievalResult {
  semanticUnits: SemanticUnit[];
  intentAlignment: number;
  coherenceScore: number;
  retrievalStrategy: string;
  explanations: RetrievalExplanation[];
}

export interface RetrievalEngine {
  retrieveByIntent(queryIntent: QueryIntent): Promise<RetrievalResult>;
  rankBySemanticConsistency(units: SemanticUnit[]): Promise<RankedResult[]>;
  filterByCoherence(units: SemanticUnit[]): Promise<SemanticUnit[]>;
  explainRetrievalDecision(result: RetrievalResult): Promise<RetrievalExplanation>;
}

// --- Context Assembly ---

export interface ContextAssembler {
  assembleContext(units: SemanticUnit[], intent: QueryIntent): Promise<CoherentContext>;
  validateCoherence(context: CoherentContext): Promise<boolean>;
  optimizeForLLM(context: CoherentContext, maxTokens: number): Promise<string>;
}
