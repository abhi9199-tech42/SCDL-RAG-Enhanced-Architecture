import { SemanticRepresentation, SemanticUnit } from '../../types';
import { generateId } from '../../utils/id';

export interface LanguagePair {
  sourceLanguage: string;
  targetLanguage: string;
  consistencyThreshold: number;
  validationStrategy: ValidationStrategy;
}

export interface ValidationStrategy {
  name: string;
  parameters: Map<string, number>;
  semanticWeightThreshold: number;
  vectorSimilarityThreshold: number;
}

export interface ConsistencyValidation {
  overallConsistency: number;
  languagePairScores: Map<string, number>;
  inconsistencies: InconsistencyReport[];
  validationTimestamp: Date;
  thresholdsMet: boolean;
}

export interface InconsistencyReport {
  id: string;
  languagePair: LanguagePair;
  inconsistencyType: InconsistencyType;
  severity: number;
  affectedSemanticUnits: SemanticUnit[];
  suggestedCorrections: Correction[];
}

export interface Correction {
  correctionType: CorrectionType;
  targetLanguage: string;
  originalRepresentation: SemanticRepresentation;
  correctedRepresentation: SemanticRepresentation;
  confidence: number;
  reasoning: string;
}

export interface ConsistencyMetrics {
  totalLanguages: number;
  totalLanguagePairs: number;
  averageConsistency: number;
  consistencyDistribution: Map<string, number>;
  validationCoverage: number;
  thresholdViolations: number;
}

export interface CorrectionResult {
  correctionId: string;
  success: boolean;
  originalInconsistency: InconsistencyReport;
  appliedCorrection: Correction;
  validationAfterCorrection: ConsistencyValidation;
  performanceImpact: number;
}

export enum InconsistencyType {
  SEMANTIC_DRIFT = 'SEMANTIC_DRIFT',
  INTENT_MISMATCH = 'INTENT_MISMATCH',
  VECTOR_DIVERGENCE = 'VECTOR_DIVERGENCE',
  COMPRESSION_VARIANCE = 'COMPRESSION_VARIANCE',
  CULTURAL_BIAS = 'CULTURAL_BIAS'
}

export enum CorrectionType {
  VECTOR_ALIGNMENT = 'VECTOR_ALIGNMENT',
  INTENT_HARMONIZATION = 'INTENT_HARMONIZATION',
  SEMANTIC_NORMALIZATION = 'SEMANTIC_NORMALIZATION',
  COMPRESSION_ADJUSTMENT = 'COMPRESSION_ADJUSTMENT',
  MANUAL_REVIEW = 'MANUAL_REVIEW'
}

export class MultiLanguageValidator {
  private validationStrategies: Map<string, ValidationStrategy>;
  private languagePairs: Map<string, LanguagePair>;
  private consistencyCache: Map<string, ConsistencyValidation>;

  constructor() {
    this.validationStrategies = new Map();
    this.languagePairs = new Map();
    this.consistencyCache = new Map();
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies(): void {
    // Vector similarity strategy
    const vectorStrategy: ValidationStrategy = {
      name: 'vector_similarity',
      parameters: new Map([
        ['cosine_threshold', 0.85],
        ['euclidean_threshold', 0.3],
        ['manhattan_threshold', 0.4]
      ]),
      semanticWeightThreshold: 0.8,
      vectorSimilarityThreshold: 0.85
    };

    // Intent alignment strategy
    const intentStrategy: ValidationStrategy = {
      name: 'intent_alignment',
      parameters: new Map([
        ['node_overlap_threshold', 0.7],
        ['edge_similarity_threshold', 0.6],
        ['graph_structure_threshold', 0.75]
      ]),
      semanticWeightThreshold: 0.75,
      vectorSimilarityThreshold: 0.8
    };

    // Semantic consistency strategy
    const semanticStrategy: ValidationStrategy = {
      name: 'semantic_consistency',
      parameters: new Map([
        ['concept_preservation_threshold', 0.9],
        ['meaning_drift_threshold', 0.15],
        ['cultural_adaptation_threshold', 0.2],
        ['node_overlap_threshold', 0.7] // Added for compatibility with intent checks
      ]),
      semanticWeightThreshold: 0.85,
      vectorSimilarityThreshold: 0.88
    };

    this.validationStrategies.set('vector_similarity', vectorStrategy);
    this.validationStrategies.set('intent_alignment', intentStrategy);
    this.validationStrategies.set('semantic_consistency', semanticStrategy);
  }

  async validateConsistency(representations: Map<string, SemanticRepresentation>): Promise<ConsistencyValidation> {
    const languages = Array.from(representations.keys());
    const languagePairScores = new Map<string, number>();
    const inconsistencies: InconsistencyReport[] = [];
    let totalConsistency = 0;
    let pairCount = 0;

    // Validate all language pairs
    for (let i = 0; i < languages.length; i++) {
      for (let j = i + 1; j < languages.length; j++) {
        const lang1 = languages[i];
        const lang2 = languages[j];
        const pairKey = `${lang1}-${lang2}`;
        
        const repr1 = representations.get(lang1)!;
        const repr2 = representations.get(lang2)!;
        
        const pairConsistency = await this.validateLanguagePair(repr1, repr2, lang1, lang2);
        languagePairScores.set(pairKey, pairConsistency.consistency);
        
        if (pairConsistency.inconsistencies.length > 0) {
          inconsistencies.push(...pairConsistency.inconsistencies);
        }
        
        totalConsistency += pairConsistency.consistency;
        pairCount++;
      }
    }

    const overallConsistency = pairCount > 0 ? totalConsistency / pairCount : 1.0;
    const thresholdsMet = this.checkThresholds(languagePairScores, inconsistencies);

    const validation: ConsistencyValidation = {
      overallConsistency,
      languagePairScores,
      inconsistencies,
      validationTimestamp: new Date(),
      thresholdsMet
    };

    // Cache the result
    const cacheKey = this.generateCacheKey(representations);
    this.consistencyCache.set(cacheKey, validation);

    return validation;
  }

  private async validateLanguagePair(
    repr1: SemanticRepresentation, 
    repr2: SemanticRepresentation, 
    lang1: string, 
    lang2: string
  ): Promise<{ consistency: number; inconsistencies: InconsistencyReport[] }> {
    const _pairKey = `${lang1}-${lang2}`;
    const languagePair = this.getOrCreateLanguagePair(lang1, lang2);
    const strategy = languagePair.validationStrategy;
    
    const inconsistencies: InconsistencyReport[] = [];
    const consistencyScores: number[] = [];

    // Vector similarity validation
    const vectorSimilarity = Math.max(0, this.calculateVectorSimilarity(repr1.semanticVector, repr2.semanticVector));
    consistencyScores.push(vectorSimilarity);
    
    if (vectorSimilarity < strategy.vectorSimilarityThreshold) {
      inconsistencies.push(this.createInconsistencyReport(
        InconsistencyType.VECTOR_DIVERGENCE,
        languagePair,
        [this.createSemanticUnit(repr1), this.createSemanticUnit(repr2)],
        1.0 - vectorSimilarity
      ));
    }

    // Intent alignment validation
    const intentAlignment = this.calculateIntentAlignment(repr1.intentNodes, repr2.intentNodes);
    consistencyScores.push(intentAlignment);
    
    if (intentAlignment < strategy.parameters.get('node_overlap_threshold')!) {
      inconsistencies.push(this.createInconsistencyReport(
        InconsistencyType.INTENT_MISMATCH,
        languagePair,
        [this.createSemanticUnit(repr1), this.createSemanticUnit(repr2)],
        1.0 - intentAlignment
      ));
    }

    // Semantic consistency validation
    const semanticConsistency = this.calculateSemanticConsistency(repr1, repr2);
    consistencyScores.push(semanticConsistency);
    
    if (semanticConsistency < strategy.parameters.get('concept_preservation_threshold')!) {
      inconsistencies.push(this.createInconsistencyReport(
        InconsistencyType.SEMANTIC_DRIFT,
        languagePair,
        [this.createSemanticUnit(repr1), this.createSemanticUnit(repr2)],
        1.0 - semanticConsistency
      ));
    }

    // Compression ratio validation
    const compressionConsistency = this.validateCompressionConsistency(repr1, repr2);
    consistencyScores.push(compressionConsistency);
    
    if (Math.abs(repr1.compressionRatio - repr2.compressionRatio) > 0.2) {
      inconsistencies.push(this.createInconsistencyReport(
        InconsistencyType.COMPRESSION_VARIANCE,
        languagePair,
        [this.createSemanticUnit(repr1), this.createSemanticUnit(repr2)],
        Math.abs(repr1.compressionRatio - repr2.compressionRatio)
      ));
    }

    const overallConsistency = consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length;

    return { consistency: overallConsistency, inconsistencies };
  }

  async detectInconsistencies(_langPair: LanguagePair): Promise<InconsistencyReport[]> {
    // This would typically scan stored semantic units for the language pair
    // For now, return empty array as this requires integration with storage
    return [];
  }

  async generateConsistencyMetrics(representations: SemanticRepresentation[]): Promise<ConsistencyMetrics> {
    const languageGroups = this.groupByLanguage(representations);
    const languagePairs = this.generateLanguagePairs(Array.from(languageGroups.keys()));
    
    let totalConsistency = 0;
    let validationCount = 0;
    let thresholdViolations = 0;
    const consistencyDistribution = new Map<string, number>();

    for (const pair of languagePairs) {
      const repr1Group = languageGroups.get(pair.sourceLanguage) || [];
      const repr2Group = languageGroups.get(pair.targetLanguage) || [];
      
      for (const repr1 of repr1Group) {
        for (const repr2 of repr2Group) {
          const validation = await this.validateLanguagePair(repr1, repr2, pair.sourceLanguage, pair.targetLanguage);
          totalConsistency += validation.consistency;
          validationCount++;
          
          if (validation.consistency < pair.consistencyThreshold) {
            thresholdViolations++;
          }
          
          const bucket = Math.floor(validation.consistency * 10) / 10;
          const bucketKey = `${bucket.toFixed(1)}-${(bucket + 0.1).toFixed(1)}`;
          consistencyDistribution.set(bucketKey, (consistencyDistribution.get(bucketKey) || 0) + 1);
        }
      }
    }

    return {
      totalLanguages: languageGroups.size,
      totalLanguagePairs: languagePairs.length,
      averageConsistency: validationCount > 0 ? totalConsistency / validationCount : 1.0,
      consistencyDistribution,
      validationCoverage: validationCount / (representations.length * (representations.length - 1) / 2),
      thresholdViolations
    };
  }

  async correctInconsistencies(inconsistencies: InconsistencyReport[]): Promise<CorrectionResult[]> {
    const results: CorrectionResult[] = [];

    for (const inconsistency of inconsistencies) {
      const correction = await this.generateCorrection(inconsistency);
      const result = await this.applyCorrection(inconsistency, correction);
      results.push(result);
    }

    return results;
  }

  private async generateCorrection(inconsistency: InconsistencyReport): Promise<Correction> {
    const units = inconsistency.affectedSemanticUnits;
    const sourceUnit = units[0];
    const targetUnit = units[1];
    
    let correctionType: CorrectionType;
    let correctedRepresentation: SemanticRepresentation;
    let confidence: number;
    let reasoning: string;

    switch (inconsistency.inconsistencyType) {
      case InconsistencyType.VECTOR_DIVERGENCE:
        correctionType = CorrectionType.VECTOR_ALIGNMENT;
        correctedRepresentation = this.alignVectors(sourceUnit.semantics, targetUnit.semantics);
        confidence = 0.8;
        reasoning = "Aligned semantic vectors using weighted averaging to reduce divergence";
        break;
        
      case InconsistencyType.INTENT_MISMATCH:
        correctionType = CorrectionType.INTENT_HARMONIZATION;
        correctedRepresentation = this.harmonizeIntents(sourceUnit.semantics, targetUnit.semantics);
        confidence = 0.75;
        reasoning = "Harmonized intent nodes to ensure consistent semantic relationships";
        break;
        
      case InconsistencyType.SEMANTIC_DRIFT:
        correctionType = CorrectionType.SEMANTIC_NORMALIZATION;
        correctedRepresentation = this.normalizeSemantics(sourceUnit.semantics, targetUnit.semantics);
        confidence = 0.85;
        reasoning = "Normalized semantic representation to preserve core meaning";
        break;
        
      case InconsistencyType.COMPRESSION_VARIANCE:
        correctionType = CorrectionType.COMPRESSION_ADJUSTMENT;
        correctedRepresentation = this.adjustCompression(sourceUnit.semantics, targetUnit.semantics);
        confidence = 0.9;
        reasoning = "Adjusted compression ratio to maintain consistency across languages";
        break;
        
      default:
        correctionType = CorrectionType.MANUAL_REVIEW;
        correctedRepresentation = sourceUnit.semantics;
        confidence = 0.0;
        reasoning = "Inconsistency requires manual review and correction";
    }

    return {
      correctionType,
      targetLanguage: inconsistency.languagePair.targetLanguage,
      originalRepresentation: sourceUnit.semantics,
      correctedRepresentation,
      confidence,
      reasoning
    };
  }

  private async applyCorrection(inconsistency: InconsistencyReport, correction: Correction): Promise<CorrectionResult> {
    const correctionId = generateId('corr');
    
    // Apply the correction (in a real system, this would update the storage)
    const success = correction.confidence > 0.5;
    
    // Validate after correction
    const validationAfterCorrection = await this.validateConsistency(
      new Map([
        [inconsistency.languagePair.sourceLanguage, correction.originalRepresentation],
        [inconsistency.languagePair.targetLanguage, correction.correctedRepresentation]
      ])
    );

    return {
      correctionId,
      success,
      originalInconsistency: inconsistency,
      appliedCorrection: correction,
      validationAfterCorrection,
      performanceImpact: this.calculatePerformanceImpact(correction)
    };
  }

  // Helper methods
  private calculateVectorSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0;
    
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    
    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude > 0 ? dot / magnitude : 0;
  }

  private calculateIntentAlignment(nodes1: any[], nodes2: any[]): number {
    if (!nodes1 || !nodes2) return 0.0;
    if (nodes1.length === 0 && nodes2.length === 0) return 1.0;
    if (nodes1.length === 0 || nodes2.length === 0) return 0.0;
    
    const concepts1 = new Set(nodes1.map(n => n.label?.toLowerCase() || n.id));
    const concepts2 = new Set(nodes2.map(n => n.label?.toLowerCase() || n.id));
    
    const intersection = new Set([...concepts1].filter(x => concepts2.has(x)));
    const union = new Set([...concepts1, ...concepts2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateSemanticConsistency(repr1: SemanticRepresentation, repr2: SemanticRepresentation): number {
    // Combine multiple consistency measures
    const vectorSim = Math.max(0, this.calculateVectorSimilarity(repr1.semanticVector, repr2.semanticVector));
    const intentAlign = this.calculateIntentAlignment(repr1.intentNodes, repr2.intentNodes);
    const hashConsistency = repr1.languageAgnosticHash === repr2.languageAgnosticHash ? 1.0 : 0.0;
    
    return (vectorSim * 0.4) + (intentAlign * 0.4) + (hashConsistency * 0.2);
  }

  private validateCompressionConsistency(repr1: SemanticRepresentation, repr2: SemanticRepresentation): number {
    const ratioDiff = Math.abs(repr1.compressionRatio - repr2.compressionRatio);
    return Math.max(0, 1.0 - (ratioDiff / 0.5)); // Normalize to 0-1 scale
  }

  private getOrCreateLanguagePair(lang1: string, lang2: string): LanguagePair {
    const pairKey = `${lang1}-${lang2}`;
    
    if (!this.languagePairs.has(pairKey)) {
      const defaultStrategy = this.validationStrategies.get('semantic_consistency')!;
      const languagePair: LanguagePair = {
        sourceLanguage: lang1,
        targetLanguage: lang2,
        consistencyThreshold: 0.8,
        validationStrategy: defaultStrategy
      };
      this.languagePairs.set(pairKey, languagePair);
    }
    
    return this.languagePairs.get(pairKey)!;
  }

  private createInconsistencyReport(
    type: InconsistencyType,
    languagePair: LanguagePair,
    units: SemanticUnit[],
    severity: number
  ): InconsistencyReport {
    return {
      id: generateId('inc'),
      languagePair,
      inconsistencyType: type,
      severity: Math.min(1.0, severity),
      affectedSemanticUnits: units,
      suggestedCorrections: this.generateCorrections(type, languagePair, units, Math.min(1.0, severity))
    };
  }

  private generateCorrections(
    type: InconsistencyType,
    languagePair: LanguagePair,
    units: SemanticUnit[],
    severity: number
  ): Correction[] {
    const corrections: Correction[] = [];
    
    // Generate a default correction based on inconsistency type
    let correctionType = CorrectionType.MANUAL_REVIEW;
    let reasoning = 'Manual review recommended for detected inconsistency.';
    
    switch (type) {
      case InconsistencyType.VECTOR_DIVERGENCE:
        correctionType = CorrectionType.VECTOR_ALIGNMENT;
        reasoning = 'Vector alignment required to reduce divergence.';
        break;
      case InconsistencyType.INTENT_MISMATCH:
        correctionType = CorrectionType.INTENT_HARMONIZATION;
        reasoning = 'Intent harmonization recommended to align semantic goals.';
        break;
      case InconsistencyType.SEMANTIC_DRIFT:
        correctionType = CorrectionType.SEMANTIC_NORMALIZATION;
        reasoning = 'Semantic normalization needed to correct drift.';
        break;
      case InconsistencyType.COMPRESSION_VARIANCE:
        correctionType = CorrectionType.COMPRESSION_ADJUSTMENT;
        reasoning = 'Compression parameters adjusted to match target density.';
        break;
    }
    
    // Create at least one correction for the target language
    if (units.length > 0) {
      const sourceUnit = units[0];
      const targetUnit = units[1]; // Assuming pair has 2 units
      let correctedRep = sourceUnit.semantics;

      // Calculate actual correction if possible
      if (targetUnit) {
        switch (type) {
          case InconsistencyType.VECTOR_DIVERGENCE:
            correctedRep = this.alignVectors(sourceUnit.semantics, targetUnit.semantics);
            break;
          case InconsistencyType.INTENT_MISMATCH:
            correctedRep = this.harmonizeIntents(sourceUnit.semantics, targetUnit.semantics);
            break;
          case InconsistencyType.SEMANTIC_DRIFT:
            correctedRep = this.normalizeSemantics(sourceUnit.semantics, targetUnit.semantics);
            break;
          case InconsistencyType.COMPRESSION_VARIANCE:
            correctedRep = this.adjustCompression(sourceUnit.semantics, targetUnit.semantics);
            break;
        }
      }

      corrections.push({
        correctionType,
        targetLanguage: languagePair.targetLanguage,
        originalRepresentation: sourceUnit.semantics,
        correctedRepresentation: correctedRep,
        confidence: 0.85,
        reasoning
      });

      // Add manual review if severity is high or inconsistency is complex
      if (severity >= 0.8) {
        corrections.push({
          correctionType: CorrectionType.MANUAL_REVIEW,
          targetLanguage: languagePair.targetLanguage,
          originalRepresentation: units[0].semantics,
          correctedRepresentation: units[0].semantics,
          confidence: 0.0,
          reasoning: 'High severity inconsistency requires manual review'
        });
      }
    }
    
    return corrections;
  }

  private createSemanticUnit(repr: SemanticRepresentation): SemanticUnit {
    return {
      id: repr.id,
      content: '', // Would be populated from storage
      semantics: repr,
      sourceReferences: repr.sourceReferences,
      metadata: {}
    };
  }

  private checkThresholds(languagePairScores: Map<string, number>, inconsistencies: InconsistencyReport[]): boolean {
    // Check if all language pairs meet their thresholds
    for (const [pairKey, score] of languagePairScores) {
      const [lang1, lang2] = pairKey.split('-');
      const languagePair = this.getOrCreateLanguagePair(lang1, lang2);
      
      if (score < languagePair.consistencyThreshold) {
        return false;
      }
    }
    
    // Check if there are any high-severity inconsistencies
    const highSeverityInconsistencies = inconsistencies.filter(inc => inc.severity > 0.7);
    return highSeverityInconsistencies.length === 0;
  }

  private generateCacheKey(representations: Map<string, SemanticRepresentation>): string {
    const keys = Array.from(representations.keys()).sort();
    const hashes = keys.map(key => representations.get(key)!.languageAgnosticHash);
    return `${keys.join('-')}-${hashes.join('-')}`;
  }

  private groupByLanguage(representations: SemanticRepresentation[]): Map<string, SemanticRepresentation[]> {
    const groups = new Map<string, SemanticRepresentation[]>();
    
    for (const repr of representations) {
      // Extract language from source references or use default
      let language = 'unknown';
      if (repr.sourceReferences && repr.sourceReferences.length > 0 && repr.sourceReferences[0].metadata) {
        language = repr.sourceReferences[0].metadata.language || 'unknown';
      }
      
      if (!groups.has(language)) {
        groups.set(language, []);
      }
      groups.get(language)!.push(repr);
    }
    
    return groups;
  }

  private generateLanguagePairs(languages: string[]): LanguagePair[] {
    const pairs: LanguagePair[] = [];
    
    for (let i = 0; i < languages.length; i++) {
      for (let j = i + 1; j < languages.length; j++) {
        pairs.push(this.getOrCreateLanguagePair(languages[i], languages[j]));
      }
    }
    
    return pairs;
  }

  private alignVectors(repr1: SemanticRepresentation, repr2: SemanticRepresentation): SemanticRepresentation {
    const alignedVector = repr1.semanticVector.map((v1, i) => {
      const v2 = repr2.semanticVector[i] || 0;
      return (v1 + v2) / 2; // Simple averaging for alignment
    });
    
    return {
      ...repr2,
      semanticVector: alignedVector
    };
  }

  private harmonizeIntents(repr1: SemanticRepresentation, repr2: SemanticRepresentation): SemanticRepresentation {
    // Merge intent nodes from both representations
    const combinedNodes = [...repr1.intentNodes, ...repr2.intentNodes];
    const uniqueNodes = combinedNodes.filter((node, index, arr) => 
      arr.findIndex(n => n.id === node.id) === index
    );
    
    return {
      ...repr2,
      intentNodes: uniqueNodes
    };
  }

  private normalizeSemantics(repr1: SemanticRepresentation, repr2: SemanticRepresentation): SemanticRepresentation {
    // Normalize by using the representation with higher compression ratio
    const betterRepr = repr1.compressionRatio > repr2.compressionRatio ? repr1 : repr2;
    
    return {
      ...repr2,
      semanticVector: betterRepr.semanticVector,
      compressionRatio: (repr1.compressionRatio + repr2.compressionRatio) / 2
    };
  }

  private adjustCompression(repr1: SemanticRepresentation, repr2: SemanticRepresentation): SemanticRepresentation {
    const avgCompressionRatio = (repr1.compressionRatio + repr2.compressionRatio) / 2;
    
    return {
      ...repr2,
      compressionRatio: avgCompressionRatio
    };
  }

  private calculatePerformanceImpact(correction: Correction): number {
    // Estimate performance impact based on correction type
    switch (correction.correctionType) {
      case CorrectionType.VECTOR_ALIGNMENT:
        return 0.1; // Low impact
      case CorrectionType.INTENT_HARMONIZATION:
        return 0.3; // Medium impact
      case CorrectionType.SEMANTIC_NORMALIZATION:
        return 0.2; // Low-medium impact
      case CorrectionType.COMPRESSION_ADJUSTMENT:
        return 0.05; // Very low impact
      case CorrectionType.MANUAL_REVIEW:
        return 1.0; // High impact (requires human intervention)
      default:
        return 0.5; // Default medium impact
    }
  }
}