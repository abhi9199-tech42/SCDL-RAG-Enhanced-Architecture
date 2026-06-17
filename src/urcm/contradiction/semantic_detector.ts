import { SemanticUnit } from '../../types';
import { Contradiction } from '../types';
import { generateId } from '../../utils/id';

export interface SemanticContradiction extends Contradiction {
  semanticDistance: number;
  intentConflictScore: number;
  vectorDivergence: number;
  conceptualInconsistency: number;
  resolutionComplexity: number;
}

export interface ContradictionPattern {
  patternId: string;
  patternType: ContradictionPatternType;
  semanticSignature: number[];
  detectionThreshold: number;
  commonInDomains: string[];
  resolutionStrategy: string;
}

export interface SemanticConsistencyScore {
  overallConsistency: number;
  vectorConsistency: number;
  intentConsistency: number;
  conceptualConsistency: number;
  temporalConsistency: number;
  factualConsistency: number;
}

export interface ContradictionCluster {
  clusterId: string;
  contradictions: SemanticContradiction[];
  clusterCentroid: number[];
  dominantPattern: ContradictionPattern;
  resolutionPriority: number;
  affectedDomains: string[];
}

export enum ContradictionPatternType {
  NEGATION_CONFLICT = 'NEGATION_CONFLICT',
  TEMPORAL_INCONSISTENCY = 'TEMPORAL_INCONSISTENCY',
  CAUSAL_CONTRADICTION = 'CAUSAL_CONTRADICTION',
  QUANTITATIVE_MISMATCH = 'QUANTITATIVE_MISMATCH',
  CATEGORICAL_CONFLICT = 'CATEGORICAL_CONFLICT',
  CONTEXTUAL_INCONSISTENCY = 'CONTEXTUAL_INCONSISTENCY',
  DEFINITIONAL_CONFLICT = 'DEFINITIONAL_CONFLICT',
  SCOPE_MISMATCH = 'SCOPE_MISMATCH'
}

export class SemanticContradictionDetector {
  private contradictionPatterns: Map<ContradictionPatternType, ContradictionPattern>;
  private semanticThresholds: Map<string, number>;
  private domainSpecificRules: Map<string, ContradictionRule[]>;
  private detectionHistory: SemanticContradiction[];

  constructor() {
    this.contradictionPatterns = new Map();
    this.semanticThresholds = new Map();
    this.domainSpecificRules = new Map();
    this.detectionHistory = [];
    
    this.initializeContradictionPatterns();
    this.initializeSemanticThresholds();
    this.initializeDomainRules();
  }

  private initializeContradictionPatterns(): void {
    // Negation conflict pattern
    const negationPattern: ContradictionPattern = {
      patternId: 'negation_conflict',
      patternType: ContradictionPatternType.NEGATION_CONFLICT,
      semanticSignature: [1.0, -1.0, 0.0, 0.8], // Simplified signature
      detectionThreshold: 0.85,
      commonInDomains: ['general', 'factual', 'scientific'],
      resolutionStrategy: 'evidence_based_resolution'
    };

    // Temporal inconsistency pattern
    const temporalPattern: ContradictionPattern = {
      patternId: 'temporal_inconsistency',
      patternType: ContradictionPatternType.TEMPORAL_INCONSISTENCY,
      semanticSignature: [0.5, 0.3, -0.9, 0.7],
      detectionThreshold: 0.75,
      commonInDomains: ['historical', 'news', 'events'],
      resolutionStrategy: 'temporal_ordering_resolution'
    };

    // Causal contradiction pattern
    const causalPattern: ContradictionPattern = {
      patternId: 'causal_contradiction',
      patternType: ContradictionPatternType.CAUSAL_CONTRADICTION,
      semanticSignature: [0.8, 0.2, 0.1, -0.8],
      detectionThreshold: 0.8,
      commonInDomains: ['scientific', 'medical', 'technical'],
      resolutionStrategy: 'causal_chain_analysis'
    };

    // Quantitative mismatch pattern
    const quantitativePattern: ContradictionPattern = {
      patternId: 'quantitative_mismatch',
      patternType: ContradictionPatternType.QUANTITATIVE_MISMATCH,
      semanticSignature: [0.3, 0.9, -0.4, 0.6],
      detectionThreshold: 0.7,
      commonInDomains: ['financial', 'statistical', 'measurement'],
      resolutionStrategy: 'numerical_reconciliation'
    };

    this.contradictionPatterns.set(ContradictionPatternType.NEGATION_CONFLICT, negationPattern);
    this.contradictionPatterns.set(ContradictionPatternType.TEMPORAL_INCONSISTENCY, temporalPattern);
    this.contradictionPatterns.set(ContradictionPatternType.CAUSAL_CONTRADICTION, causalPattern);
    this.contradictionPatterns.set(ContradictionPatternType.QUANTITATIVE_MISMATCH, quantitativePattern);
  }

  private initializeSemanticThresholds(): void {
    this.semanticThresholds.set('vector_similarity_threshold', 0.15);
    this.semanticThresholds.set('intent_conflict_threshold', 0.3);
    this.semanticThresholds.set('conceptual_inconsistency_threshold', 0.25);
    this.semanticThresholds.set('temporal_inconsistency_threshold', 0.2);
    this.semanticThresholds.set('factual_contradiction_threshold', 0.4);
    this.semanticThresholds.set('semantic_distance_threshold', 0.2); // Lowered from 0.35 to be more sensitive
  }

  private initializeDomainRules(): void {
    // Medical domain rules
    const medicalRules: ContradictionRule[] = [
      {
        ruleId: 'medical_dosage_conflict',
        description: 'Detect conflicting medication dosages',
        semanticPatterns: ['dosage', 'medication', 'prescription'],
        conflictThreshold: 0.9,
        severity: 0.95
      },
      {
        ruleId: 'medical_diagnosis_conflict',
        description: 'Detect conflicting diagnoses',
        semanticPatterns: ['diagnosis', 'condition', 'disease', 'hypertension', 'blood pressure'],
        conflictThreshold: 0.85,
        severity: 0.9
      },
      {
        ruleId: 'medical_blood_pressure_conflict',
        description: 'Detect conflicting blood pressure readings',
        semanticPatterns: ['blood pressure', 'hypertension', 'elevated', 'normal'],
        conflictThreshold: 0.7,
        severity: 0.85
      },
      {
        ruleId: 'medical_vital_signs_conflict',
        description: 'Detect conflicting vital signs',
        semanticPatterns: ['patient', 'signs', 'symptoms', 'readings'],
        conflictThreshold: 0.75,
        severity: 0.8
      }
    ];

    // Legal domain rules
    const legalRules: ContradictionRule[] = [
      {
        ruleId: 'legal_precedent_conflict',
        description: 'Detect conflicting legal precedents',
        semanticPatterns: ['precedent', 'ruling', 'judgment'],
        conflictThreshold: 0.8,
        severity: 0.85
      },
      {
        ruleId: 'legal_statute_conflict',
        description: 'Detect conflicting statutory interpretations',
        semanticPatterns: ['statute', 'law', 'regulation'],
        conflictThreshold: 0.9,
        severity: 0.9
      }
    ];

    // Financial domain rules
    const financialRules: ContradictionRule[] = [
      {
        ruleId: 'financial_data_conflict',
        description: 'Detect conflicting financial data',
        semanticPatterns: ['revenue', 'profit', 'loss', 'earnings'],
        conflictThreshold: 0.7,
        severity: 0.8
      }
    ];

    this.domainSpecificRules.set('medical', medicalRules);
    this.domainSpecificRules.set('legal', legalRules);
    this.domainSpecificRules.set('financial', financialRules);
  }

  async detectSemanticContradictions(semanticUnits: SemanticUnit[]): Promise<SemanticContradiction[]> {
    const contradictions: SemanticContradiction[] = [];
    
    // Pairwise contradiction detection
    for (let i = 0; i < semanticUnits.length; i++) {
      for (let j = i + 1; j < semanticUnits.length; j++) {
        const unit1 = semanticUnits[i];
        const unit2 = semanticUnits[j];
        
        const contradiction = await this.detectPairwiseContradiction(unit1, unit2);
        if (contradiction) {
          contradictions.push(contradiction);
        }
      }
    }
    
    // Cluster-based contradiction detection
    const clusters = this.clusterSemanticUnits(semanticUnits);
    for (const cluster of clusters) {
      const clusterContradictions = await this.detectClusterContradictions(cluster);
      contradictions.push(...clusterContradictions);
    }
    
    // Pattern-based contradiction detection
    const patternContradictions = await this.detectPatternBasedContradictions(semanticUnits);
    contradictions.push(...patternContradictions);
    
    // Domain-specific contradiction detection
    const domainContradictions = await this.detectDomainSpecificContradictions(semanticUnits);
    contradictions.push(...domainContradictions);
    
    // Deduplicate and rank contradictions
    const uniqueContradictions = this.deduplicateContradictions(contradictions);
    const rankedContradictions = this.rankContradictionsBySeverity(uniqueContradictions);
    
    // Store in history for learning
    this.detectionHistory.push(...rankedContradictions);
    
    return rankedContradictions;
  }

  private async detectPairwiseContradiction(unit1: SemanticUnit, unit2: SemanticUnit): Promise<SemanticContradiction | null> {
    // Calculate semantic distance
    const semanticDistance = this.calculateSemanticDistance(unit1.semantics.semanticVector, unit2.semantics.semanticVector);
    
    // Calculate intent conflict score
    const intentConflictScore = this.calculateIntentConflictScore(unit1.semantics.intentNodes, unit2.semantics.intentNodes);
    
    // Calculate vector divergence
    const vectorDivergence = this.calculateVectorDivergence(unit1.semantics.semanticVector, unit2.semantics.semanticVector);
    
    // Calculate conceptual inconsistency
    const conceptualInconsistency = await this.calculateConceptualInconsistency(unit1, unit2);
    
    // Determine if contradiction exists
    const contradictionScore = this.calculateContradictionScore(
      semanticDistance, 
      intentConflictScore, 
      vectorDivergence, 
      conceptualInconsistency
    );
    
    const threshold = this.semanticThresholds.get('semantic_distance_threshold') || 0.2;
    
    if (contradictionScore > threshold) {
      return this.createSemanticContradiction(
        unit1, 
        unit2, 
        semanticDistance, 
        intentConflictScore, 
        vectorDivergence, 
        conceptualInconsistency,
        contradictionScore
      );
    }
    
    return null;
  }

  private calculateSemanticDistance(vector1: number[], vector2: number[]): number {
    // Calculate Euclidean distance between semantic vectors
    if (vector1.length !== vector2.length) return 1.0;
    
    let sumSquaredDiffs = 0;
    for (let i = 0; i < vector1.length; i++) {
      const diff = vector1[i] - vector2[i];
      sumSquaredDiffs += diff * diff;
    }
    
    return Math.sqrt(sumSquaredDiffs) / Math.sqrt(vector1.length);
  }

  private calculateIntentConflictScore(intentNodes1: any[], intentNodes2: any[]): number {
    if (!intentNodes1 || !intentNodes2) return 0;
    if (intentNodes1.length === 0 || intentNodes2.length === 0) return 0;
    
    // Extract intent types and compare
    const intents1 = new Set(intentNodes1.map(node => node.intentType || node.label));
    const intents2 = new Set(intentNodes2.map(node => node.intentType || node.label));
    
    // Look for conflicting intent patterns
    const conflictingPairs = [
      ['positive', 'negative'],
      ['affirm', 'deny'],
      ['support', 'oppose'],
      ['increase', 'decrease'],
      ['enable', 'disable']
    ];
    
    let conflictScore = 0;
    for (const [intent1, intent2] of conflictingPairs) {
      if (intents1.has(intent1) && intents2.has(intent2)) {
        conflictScore += 0.8;
      }
      if (intents1.has(intent2) && intents2.has(intent1)) {
        conflictScore += 0.8;
      }
    }
    
    // Calculate semantic overlap (lower overlap might indicate conflict)
    const intersection = new Set([...intents1].filter(x => intents2.has(x)));
    const union = new Set([...intents1, ...intents2]);
    const overlap = intersection.size / union.size;
    
    // Combine conflict indicators
    return Math.min(1.0, conflictScore + (1.0 - overlap) * 0.5);
  }

  private calculateVectorDivergence(vector1: number[], vector2: number[]): number {
    // Calculate cosine similarity and convert to divergence
    if (vector1.length !== vector2.length) return 1.0;
    
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < vector1.length; i++) {
      dot += vector1[i] * vector2[i];
      mag1 += vector1[i] * vector1[i];
      mag2 += vector2[i] * vector2[i];
    }
    
    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    const similarity = magnitude > 0 ? dot / magnitude : 0;
    
    // Convert similarity to divergence (1 - similarity)
    return Math.max(0, 1.0 - similarity);
  }

  private async calculateConceptualInconsistency(unit1: SemanticUnit, unit2: SemanticUnit): Promise<number> {
    // Analyze conceptual inconsistency based on content and semantic representation
    
    // If semantic hashes are identical, they are the same content (or translation)
    if (unit1.semantics.languageAgnosticHash === unit2.semantics.languageAgnosticHash) {
      return 0;
    }

    const content1 = unit1.content.toLowerCase();
    const content2 = unit2.content.toLowerCase();
    
    // Look for explicit contradictory terms
    const contradictoryTerms = this.findContradictoryTerms(content1, content2);
    
    // Calculate content similarity to ensure we don't flag unrelated topics
    const contentSimilarity = this.calculateContentSimilarity(content1, content2);
    
    // Combine indicators
    // Only count contradictions if there is some shared context (similarity > 0.1)
    // or if the contradiction is extremely explicit (score > 0.8)
    if (contentSimilarity < 0.1 && contradictoryTerms < 0.8) {
      return 0;
    }

    return Math.min(1.0, contradictoryTerms);
  }

  private findContradictoryTerms(content1: string, content2: string): number {
    const contradictoryPairs = [
      ['true', 'false'],
      ['yes', 'no'],
      ['correct', 'incorrect'],
      ['valid', 'invalid'],
      ['possible', 'impossible'],
      ['always', 'never'],
      ['all', 'none'],
      ['increase', 'decrease'],
      ['rise', 'fall'],
      ['positive', 'negative'],
      ['good', 'bad'],
      ['safe', 'dangerous'],
      ['healthy', 'unhealthy'],
      ['legal', 'illegal'],
      ['allowed', 'forbidden'],
      ['clear', 'cloudy'],
      ['bright', 'dark'],
      ['hot', 'cold'],
      ['high', 'low'],
      ['start', 'end'],
      ['begin', 'finish'],
      ['fast', 'slow'],
      ['hypertension', 'normal'],
      ['elevated', 'normal'],
      ['malignant', 'benign']
    ];
    
    let contradictionScore = 0;
    
    for (const [term1, term2] of contradictoryPairs) {
      if (content1.includes(term1) && content2.includes(term2)) {
        contradictionScore += 0.5; // Increased from 0.4
      }
      if (content1.includes(term2) && content2.includes(term1)) {
        contradictionScore += 0.5; // Increased from 0.4
      }
    }
    
    // Look for negation patterns
    const negationPatterns = ['not', 'no', 'never', 'cannot', 'impossible', 'false'];
    const hasNegation1 = negationPatterns.some(pattern => content1.includes(pattern));
    const hasNegation2 = negationPatterns.some(pattern => content2.includes(pattern));
    
    if (hasNegation1 !== hasNegation2) {
      contradictionScore += 0.5; // Increased from 0.3
    }
    
    return Math.min(1.0, contradictionScore);
  }

  private calculateContradictionScore(
    semanticDistance: number,
    intentConflictScore: number,
    vectorDivergence: number,
    conceptualInconsistency: number
  ): number {
    // Weighted combination of contradiction indicators
    const weights = {
      semanticDistance: 0.2,
      intentConflict: 0.2,
      vectorDivergence: 0.2,
      conceptualInconsistency: 0.4 // Increased weight for conceptual inconsistency
    };
    
    const score = (
      semanticDistance * weights.semanticDistance +
      intentConflictScore * weights.intentConflict +
      vectorDivergence * weights.vectorDivergence +
      conceptualInconsistency * weights.conceptualInconsistency
    );
    
    // Boost score if any individual metric is high
    const maxMetric = Math.max(semanticDistance, intentConflictScore, vectorDivergence, conceptualInconsistency);
    const boostedScore = score + (maxMetric > 0.5 ? maxMetric * 0.3 : 0);
    
    return Math.min(1.0, boostedScore);
  }

  private createSemanticContradiction(
    unit1: SemanticUnit,
    unit2: SemanticUnit,
    semanticDistance: number,
    intentConflictScore: number,
    vectorDivergence: number,
    conceptualInconsistency: number,
    contradictionScore: number
  ): SemanticContradiction {
    const resolutionComplexity = this.calculateResolutionComplexity(
      semanticDistance,
      intentConflictScore,
      vectorDivergence,
      conceptualInconsistency
    );
    
    return {
      id: generateId('semantic-contradiction'),
      sourceIds: [unit1.id, unit2.id],
      description: `Semantic contradiction detected between units with ${contradictionScore.toFixed(2)} contradiction score`,
      severity: contradictionScore,
      type: this.determineContradictionType(intentConflictScore, conceptualInconsistency),
      detectionConfidence: Math.min(1.0, contradictionScore * 1.2),
      semanticDistance,
      intentConflictScore,
      vectorDivergence,
      conceptualInconsistency,
      resolutionComplexity
    };
  }

  private calculateResolutionComplexity(
    semanticDistance: number,
    intentConflictScore: number,
    vectorDivergence: number,
    conceptualInconsistency: number
  ): number {
    // Higher values in any dimension increase resolution complexity
    const maxComplexity = Math.max(semanticDistance, intentConflictScore, vectorDivergence, conceptualInconsistency);
    const avgComplexity = (semanticDistance + intentConflictScore + vectorDivergence + conceptualInconsistency) / 4;
    
    // Combine max and average for balanced complexity assessment
    return (maxComplexity * 0.6) + (avgComplexity * 0.4);
  }

  private determineContradictionType(intentConflictScore: number, conceptualInconsistency: number): 'logical' | 'temporal' | 'factual' | 'semantic' {
    if (intentConflictScore > 0.7) return 'logical';
    if (conceptualInconsistency > 0.6) return 'semantic';
    if (intentConflictScore > 0.4) return 'factual';
    return 'temporal';
  }

  private clusterSemanticUnits(semanticUnits: SemanticUnit[]): SemanticUnit[][] {
    // Simple clustering based on semantic similarity
    const clusters: SemanticUnit[][] = [];
    const processed = new Set<string>();
    
    for (const unit of semanticUnits) {
      if (processed.has(unit.id)) continue;
      
      const cluster = [unit];
      processed.add(unit.id);
      
      // Find similar units for this cluster
      for (const otherUnit of semanticUnits) {
        if (processed.has(otherUnit.id)) continue;
        
        const similarity = this.calculateSemanticSimilarity(unit.semantics.semanticVector, otherUnit.semantics.semanticVector);
        if (similarity > 0.7) {
          cluster.push(otherUnit);
          processed.add(otherUnit.id);
        }
      }
      
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }

  private calculateSemanticSimilarity(vector1: number[], vector2: number[]): number {
    // Calculate cosine similarity
    if (vector1.length !== vector2.length) return 0;
    
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < vector1.length; i++) {
      dot += vector1[i] * vector2[i];
      mag1 += vector1[i] * vector1[i];
      mag2 += vector2[i] * vector2[i];
    }
    
    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude > 0 ? dot / magnitude : 0;
  }

  private async detectClusterContradictions(cluster: SemanticUnit[]): Promise<SemanticContradiction[]> {
    // Detect contradictions within semantically similar clusters
    // These are often more subtle and require deeper analysis
    const contradictions: SemanticContradiction[] = [];
    
    if (cluster.length < 2) return contradictions;
    
    // Calculate cluster centroid
    const centroid = this.calculateClusterCentroid(cluster);
    
    // Find outliers that might be contradictory
    for (const unit of cluster) {
      const distanceFromCentroid = this.calculateSemanticDistance(unit.semantics.semanticVector, centroid);
      
      if (distanceFromCentroid > 0.3) {
        // This unit is an outlier in the cluster - might be contradictory
        const contradiction = await this.createClusterContradiction(unit, cluster, distanceFromCentroid);
        if (contradiction) {
          contradictions.push(contradiction);
        }
      }
    }
    
    return contradictions;
  }

  private calculateClusterCentroid(cluster: SemanticUnit[]): number[] {
    if (cluster.length === 0) return [];
    
    const vectorLength = cluster[0].semantics.semanticVector.length;
    const centroid = new Array(vectorLength).fill(0);
    
    for (const unit of cluster) {
      for (let i = 0; i < vectorLength; i++) {
        centroid[i] += unit.semantics.semanticVector[i];
      }
    }
    
    // Average the vectors
    for (let i = 0; i < vectorLength; i++) {
      centroid[i] /= cluster.length;
    }
    
    return centroid;
  }

  private async createClusterContradiction(
    outlierUnit: SemanticUnit,
    cluster: SemanticUnit[],
    distanceFromCentroid: number
  ): Promise<SemanticContradiction | null> {
    // Create contradiction for outlier in cluster
    const clusterIds = cluster.filter(u => u.id !== outlierUnit.id).map(u => u.id);
    
    return {
      id: generateId('cluster-contradiction'),
      sourceIds: [outlierUnit.id, ...clusterIds.slice(0, 3)], // Limit to avoid too many IDs
      description: `Semantic outlier detected in cluster with distance ${distanceFromCentroid.toFixed(2)} from centroid`,
      severity: Math.min(1.0, distanceFromCentroid * 1.5),
      type: 'semantic',
      detectionConfidence: 0.7,
      semanticDistance: distanceFromCentroid,
      intentConflictScore: 0.3,
      vectorDivergence: distanceFromCentroid,
      conceptualInconsistency: 0.2,
      resolutionComplexity: distanceFromCentroid * 0.8
    };
  }

  private async detectPatternBasedContradictions(semanticUnits: SemanticUnit[]): Promise<SemanticContradiction[]> {
    const contradictions: SemanticContradiction[] = [];
    
    // Apply each contradiction pattern
    for (const [_, pattern] of this.contradictionPatterns) {
      const patternContradictions = await this.applyContradictionPattern(semanticUnits, pattern);
      contradictions.push(...patternContradictions);
    }
    
    return contradictions;
  }

  private async applyContradictionPattern(
    semanticUnits: SemanticUnit[],
    pattern: ContradictionPattern
  ): Promise<SemanticContradiction[]> {
    const contradictions: SemanticContradiction[] = [];
    
    // Find units that match the pattern signature
    const matchingUnits = semanticUnits.filter(unit => 
      this.matchesPatternSignature(unit, pattern)
    );
    
    if (matchingUnits.length < 2) return contradictions;
    
    // Check for contradictions among matching units
    for (let i = 0; i < matchingUnits.length; i++) {
      for (let j = i + 1; j < matchingUnits.length; j++) {
        const unit1 = matchingUnits[i];
        const unit2 = matchingUnits[j];
        
        const patternScore = this.calculatePatternContradictionScore(unit1, unit2, pattern);
        
        if (patternScore > pattern.detectionThreshold) {
          const contradiction = this.createPatternBasedContradiction(unit1, unit2, pattern, patternScore);
          contradictions.push(contradiction);
        }
      }
    }
    
    return contradictions;
  }

  private matchesPatternSignature(unit: SemanticUnit, pattern: ContradictionPattern): boolean {
    // Check if unit's semantic vector matches the pattern signature
    const vector = unit.semantics.semanticVector;
    const signature = pattern.semanticSignature;
    
    if (vector.length < signature.length) return false;
    
    // Calculate correlation with pattern signature
    let correlation = 0;
    for (let i = 0; i < signature.length; i++) {
      correlation += vector[i] * signature[i];
    }
    
    const normalizedCorrelation = correlation / signature.length;
    return normalizedCorrelation > 0.5;
  }

  private calculatePatternContradictionScore(
    unit1: SemanticUnit,
    unit2: SemanticUnit,
    pattern: ContradictionPattern
  ): number {
    // Calculate how well the units match the contradiction pattern
    const semanticDistance = this.calculateSemanticDistance(
      unit1.semantics.semanticVector,
      unit2.semantics.semanticVector
    );
    
    const intentConflict = this.calculateIntentConflictScore(
      unit1.semantics.intentNodes,
      unit2.semantics.intentNodes
    );
    
    // Pattern-specific scoring
    let patternScore = 0;
    switch (pattern.patternType) {
      case ContradictionPatternType.NEGATION_CONFLICT:
        patternScore = this.scoreNegationConflict(unit1, unit2);
        break;
      case ContradictionPatternType.TEMPORAL_INCONSISTENCY:
        patternScore = this.scoreTemporalInconsistency(unit1, unit2);
        break;
      case ContradictionPatternType.CAUSAL_CONTRADICTION:
        patternScore = this.scoreCausalContradiction(unit1, unit2);
        break;
      case ContradictionPatternType.QUANTITATIVE_MISMATCH:
        patternScore = this.scoreQuantitativeMismatch(unit1, unit2);
        break;
      default:
        patternScore = (semanticDistance + intentConflict) / 2;
    }
    
    return patternScore;
  }

  private scoreNegationConflict(unit1: SemanticUnit, unit2: SemanticUnit): number {
    const content1 = unit1.content.toLowerCase();
    const content2 = unit2.content.toLowerCase();
    
    // Look for explicit negation patterns
    const negationWords = ['not', 'no', 'never', 'cannot', 'impossible', 'false', 'incorrect'];
    const affirmationWords = ['yes', 'true', 'correct', 'possible', 'can', 'always'];
    
    const hasNegation1 = negationWords.some(word => content1.includes(word));
    const hasNegation2 = negationWords.some(word => content2.includes(word));
    const hasAffirmation1 = affirmationWords.some(word => content1.includes(word));
    const hasAffirmation2 = affirmationWords.some(word => content2.includes(word));
    
    // Score based on negation/affirmation patterns
    if ((hasNegation1 && hasAffirmation2) || (hasAffirmation1 && hasNegation2)) {
      return 0.9;
    }
    
    if (hasNegation1 !== hasNegation2) {
      return 0.6;
    }
    
    return 0.2;
  }

  private scoreTemporalInconsistency(unit1: SemanticUnit, unit2: SemanticUnit): number {
    // Look for temporal markers and inconsistencies
    const temporalMarkers = ['before', 'after', 'during', 'when', 'then', 'first', 'last', 'earlier', 'later'];
    const content1 = unit1.content.toLowerCase();
    const content2 = unit2.content.toLowerCase();
    
    const hasTemporal1 = temporalMarkers.some(marker => content1.includes(marker));
    const hasTemporal2 = temporalMarkers.some(marker => content2.includes(marker));
    
    if (!hasTemporal1 || !hasTemporal2) return 0.1;
    
    // Simple heuristic: look for conflicting temporal relationships
    const conflictingPairs = [
      ['before', 'after'],
      ['first', 'last'],
      ['earlier', 'later'],
      ['past', 'future']
    ];
    
    for (const [term1, term2] of conflictingPairs) {
      if ((content1.includes(term1) && content2.includes(term2)) ||
          (content1.includes(term2) && content2.includes(term1))) {
        return 0.8;
      }
    }
    
    return 0.3;
  }

  private scoreCausalContradiction(unit1: SemanticUnit, unit2: SemanticUnit): number {
    // Look for causal relationships and contradictions
    const causalMarkers = ['because', 'causes', 'results in', 'leads to', 'due to', 'therefore', 'consequently'];
    const content1 = unit1.content.toLowerCase();
    const content2 = unit2.content.toLowerCase();
    
    const hasCausal1 = causalMarkers.some(marker => content1.includes(marker));
    const hasCausal2 = causalMarkers.some(marker => content2.includes(marker));
    
    if (!hasCausal1 || !hasCausal2) return 0.1;
    
    // Look for contradictory causal relationships
    // This is a simplified heuristic - real implementation would need more sophisticated analysis
    const semanticSimilarity = this.calculateSemanticSimilarity(
      unit1.semantics.semanticVector,
      unit2.semantics.semanticVector
    );
    
    // If content is similar but vectors are different, might indicate causal contradiction
    const contentSimilarity = this.calculateContentSimilarity(unit1.content, unit2.content);
    
    if (contentSimilarity > 0.6 && semanticSimilarity < 0.4) {
      return 0.7;
    }
    
    return 0.2;
  }

  private scoreQuantitativeMismatch(unit1: SemanticUnit, unit2: SemanticUnit): number {
    // Look for numerical values and mismatches
    const numberRegex = /\d+(?:\.\d+)?/g;
    const numbers1 = unit1.content.match(numberRegex) || [];
    const numbers2 = unit2.content.match(numberRegex) || [];
    
    if (numbers1.length === 0 || numbers2.length === 0) return 0.1;
    
    // Compare numerical values
    const values1 = numbers1.map(n => parseFloat(n));
    const values2 = numbers2.map(n => parseFloat(n));
    
    let maxDifference = 0;
    for (const val1 of values1) {
      for (const val2 of values2) {
        const difference = Math.abs(val1 - val2) / Math.max(val1, val2, 1);
        maxDifference = Math.max(maxDifference, difference);
      }
    }
    
    return Math.min(1.0, maxDifference);
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple Jaccard similarity for content
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private createPatternBasedContradiction(
    unit1: SemanticUnit,
    unit2: SemanticUnit,
    pattern: ContradictionPattern,
    patternScore: number
  ): SemanticContradiction {
    return {
      id: `pattern-contradiction-${pattern.patternId}-${Date.now()}`,
      sourceIds: [unit1.id, unit2.id],
      description: `${pattern.patternType} detected with score ${patternScore.toFixed(2)}`,
      severity: patternScore,
      type: this.mapPatternTypeToContradictionType(pattern.patternType),
      detectionConfidence: Math.min(1.0, patternScore * 1.1),
      semanticDistance: this.calculateSemanticDistance(unit1.semantics.semanticVector, unit2.semantics.semanticVector),
      intentConflictScore: this.calculateIntentConflictScore(unit1.semantics.intentNodes, unit2.semantics.intentNodes),
      vectorDivergence: this.calculateVectorDivergence(unit1.semantics.semanticVector, unit2.semantics.semanticVector),
      conceptualInconsistency: patternScore * 0.8,
      resolutionComplexity: patternScore * 0.9
    };
  }

  private mapPatternTypeToContradictionType(patternType: ContradictionPatternType): 'logical' | 'temporal' | 'factual' | 'semantic' {
    switch (patternType) {
      case ContradictionPatternType.NEGATION_CONFLICT:
      case ContradictionPatternType.CAUSAL_CONTRADICTION:
        return 'logical';
      case ContradictionPatternType.TEMPORAL_INCONSISTENCY:
        return 'temporal';
      case ContradictionPatternType.QUANTITATIVE_MISMATCH:
      case ContradictionPatternType.DEFINITIONAL_CONFLICT:
        return 'factual';
      default:
        return 'semantic';
    }
  }

  private async detectDomainSpecificContradictions(semanticUnits: SemanticUnit[]): Promise<SemanticContradiction[]> {
    const contradictions: SemanticContradiction[] = [];
    
    // Group units by domain
    const domainGroups = this.groupUnitsByDomain(semanticUnits);
    
    // Apply domain-specific rules
    for (const [domain, units] of domainGroups) {
      const domainRules = this.domainSpecificRules.get(domain);
      if (domainRules) {
        const domainContradictions = await this.applyDomainRules(units, domainRules);
        contradictions.push(...domainContradictions);
      }
    }
    
    return contradictions;
  }

  private groupUnitsByDomain(semanticUnits: SemanticUnit[]): Map<string, SemanticUnit[]> {
    const domainGroups = new Map<string, SemanticUnit[]>();
    
    for (const unit of semanticUnits) {
      const domain = this.extractDomain(unit);
      
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain)!.push(unit);
    }
    
    return domainGroups;
  }

  private extractDomain(unit: SemanticUnit): string {
    // Extract domain from metadata first (highest priority)
    if (unit.metadata?.domain) {
      return unit.metadata.domain;
    }
    
    // Simple keyword-based domain detection
    const content = unit.content.toLowerCase();
    
    // Medical domain keywords
    if (content.includes('medical') || content.includes('patient') || content.includes('diagnosis') ||
        content.includes('blood pressure') || content.includes('hypertension') || content.includes('medication') ||
        content.includes('treatment') || content.includes('symptoms') || content.includes('disease') ||
        content.includes('condition') || content.includes('dosage') || content.includes('prescription')) {
      return 'medical';
    }
    
    if (content.includes('legal') || content.includes('law') || content.includes('court')) {
      return 'legal';
    }
    
    if (content.includes('financial') || content.includes('money') || content.includes('investment')) {
      return 'financial';
    }
    
    return 'general';
  }

  private async applyDomainRules(units: SemanticUnit[], rules: ContradictionRule[]): Promise<SemanticContradiction[]> {
    const contradictions: SemanticContradiction[] = [];
    
    for (const rule of rules) {
      const ruleContradictions = await this.applyDomainRule(units, rule);
      contradictions.push(...ruleContradictions);
    }
    
    return contradictions;
  }

  private async applyDomainRule(units: SemanticUnit[], rule: ContradictionRule): Promise<SemanticContradiction[]> {
    const contradictions: SemanticContradiction[] = [];
    
    // Find units that match the rule's semantic patterns
    const matchingUnits = units.filter(unit => 
      rule.semanticPatterns.some(pattern => 
        unit.content.toLowerCase().includes(pattern.toLowerCase())
      )
    );
    
    if (matchingUnits.length < 2) return contradictions;
    
    // Check for contradictions among matching units
    for (let i = 0; i < matchingUnits.length; i++) {
      for (let j = i + 1; j < matchingUnits.length; j++) {
        const unit1 = matchingUnits[i];
        const unit2 = matchingUnits[j];
        
        const ruleScore = await this.calculateDomainRuleScore(unit1, unit2, rule);
        
        if (ruleScore > rule.conflictThreshold) {
          const contradiction = this.createDomainRuleContradiction(unit1, unit2, rule, ruleScore);
          contradictions.push(contradiction);
        }
      }
    }
    
    return contradictions;
  }

  private async calculateDomainRuleScore(unit1: SemanticUnit, unit2: SemanticUnit, rule: ContradictionRule): Promise<number> {
    // Calculate contradiction score based on domain rule
    const semanticDistance = this.calculateSemanticDistance(
      unit1.semantics.semanticVector,
      unit2.semantics.semanticVector
    );
    
    const conceptualInconsistency = await this.calculateConceptualInconsistency(unit1, unit2);
    
    // Domain-specific scoring adjustments
    let domainScore = (semanticDistance + conceptualInconsistency) / 2;
    
    // If conceptual inconsistency is high (indicating direct contradiction), use it as base score
    if (conceptualInconsistency > 0.6) {
      domainScore = conceptualInconsistency;
    }
    
    // Check for rule-specific patterns
    const patternMatches = rule.semanticPatterns.filter(pattern => 
      unit1.content.toLowerCase().includes(pattern.toLowerCase()) &&
      unit2.content.toLowerCase().includes(pattern.toLowerCase())
    ).length;
    
    if (patternMatches > 0) {
      domainScore *= (1 + patternMatches * 0.2);
    }
    
    return Math.min(1.0, domainScore);
  }

  private createDomainRuleContradiction(
    unit1: SemanticUnit,
    unit2: SemanticUnit,
    rule: ContradictionRule,
    ruleScore: number
  ): SemanticContradiction {
    // Determine domain from the units to set the correct contradiction type
    const domain = this.extractDomain(unit1) || this.extractDomain(unit2) || 'general';
    
    return {
      id: `domain-contradiction-${rule.ruleId}-${Date.now()}`,
      sourceIds: [unit1.id, unit2.id],
      description: `Domain-specific contradiction: ${rule.description}`,
      severity: Math.max(rule.severity, ruleScore),
      type: domain as any, // Use domain as the contradiction type (e.g., 'medical', 'legal', 'financial')
      detectionConfidence: 0.85,
      semanticDistance: this.calculateSemanticDistance(unit1.semantics.semanticVector, unit2.semantics.semanticVector),
      intentConflictScore: this.calculateIntentConflictScore(unit1.semantics.intentNodes, unit2.semantics.intentNodes),
      vectorDivergence: this.calculateVectorDivergence(unit1.semantics.semanticVector, unit2.semantics.semanticVector),
      conceptualInconsistency: ruleScore,
      resolutionComplexity: rule.severity
    };
  }

  private deduplicateContradictions(contradictions: SemanticContradiction[]): SemanticContradiction[] {
    // Remove duplicate contradictions based on source IDs and type
    const seen = new Set<string>();
    const unique: SemanticContradiction[] = [];
    
    for (const contradiction of contradictions) {
      // Include type in the key to allow multiple contradiction types for the same pair
      const key = `${contradiction.sourceIds.sort().join('-')}:${contradiction.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(contradiction);
      }
    }
    
    return unique;
  }

  private rankContradictionsBySeverity(contradictions: SemanticContradiction[]): SemanticContradiction[] {
    return contradictions.sort((a, b) => {
      // Primary sort by severity
      if (a.severity !== b.severity) {
        return b.severity - a.severity;
      }
      
      // Secondary sort by detection confidence
      if (a.detectionConfidence !== b.detectionConfidence) {
        return b.detectionConfidence - a.detectionConfidence;
      }
      
      // Tertiary sort by resolution complexity (lower complexity first)
      return a.resolutionComplexity - b.resolutionComplexity;
    });
  }
}

interface ContradictionRule {
  ruleId: string;
  description: string;
  semanticPatterns: string[];
  conflictThreshold: number;
  severity: number;
}