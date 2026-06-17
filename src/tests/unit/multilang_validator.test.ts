import { describe, it, expect, beforeEach } from 'vitest';
import { MultiLanguageValidator, InconsistencyType, CorrectionType } from '../../isre/multilang/validator';
import { SemanticRepresentation } from '../../types';

describe('MultiLanguageValidator Unit Tests', () => {
  let validator: MultiLanguageValidator;

  beforeEach(() => {
    validator = new MultiLanguageValidator();
  });

  describe('Language Pair Validation', () => {
    it('should validate identical representations as highly consistent', async () => {
      const identicalRepr: SemanticRepresentation = {
        id: 'test',
        semanticVector: [0.1, 0.2, 0.3, 0.4],
        intentNodes: [{ id: 'node1', label: 'test', confidence: 0.9, attributes: { type: 'CONTEXT', semanticPayload: [], conflictMarkers: [] } }],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'en' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'identical-hash'
      };

      const reprMap = new Map([
        ['en', identicalRepr],
        ['es', { ...identicalRepr, id: 'test-es', sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'es' } }] }]
      ]);

      const validation = await validator.validateConsistency(reprMap);

      expect(validation.overallConsistency).toBeGreaterThan(0.95);
      expect(validation.thresholdsMet).toBe(true);
      expect(validation.inconsistencies).toHaveLength(0);
    });

    it('should detect vector divergence between language pairs', async () => {
      const englishRepr: SemanticRepresentation = {
        id: 'en-test',
        semanticVector: [1.0, 0.0, 0.0, 0.0],
        intentNodes: [{ id: 'node1', label: 'test1', confidence: 0.9, attributes: { type: 'CONTEXT', semanticPayload: [], conflictMarkers: [] } }],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'en' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'en-hash'
      };

      const spanishRepr: SemanticRepresentation = {
        id: 'es-test',
        semanticVector: [0.0, 1.0, 0.0, 0.0], // Orthogonal vector
        intentNodes: [{ id: 'node2', label: 'test2', confidence: 0.9, attributes: { type: 'CONTEXT', semanticPayload: [], conflictMarkers: [] } }],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'es' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'es-hash'
      };

      const reprMap = new Map([
        ['en', englishRepr],
        ['es', spanishRepr]
      ]);

      const validation = await validator.validateConsistency(reprMap);

      expect(validation.overallConsistency).toBeLessThan(0.5);
      expect(validation.inconsistencies.length).toBeGreaterThan(0);
      
      const vectorDivergence = validation.inconsistencies.find(
        inc => inc.inconsistencyType === InconsistencyType.VECTOR_DIVERGENCE
      );
      expect(vectorDivergence).toBeDefined();
    });

    it('should detect intent mismatch between representations', async () => {
      const englishRepr: SemanticRepresentation = {
        id: 'en-test',
        semanticVector: [0.5, 0.5, 0.0, 0.0],
        intentNodes: [
          { id: 'goal1', label: 'achieve', confidence: 0.9, attributes: { type: 'GOAL', semanticPayload: [], conflictMarkers: [] } }
        ],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'en' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'en-hash'
      };

      const spanishRepr: SemanticRepresentation = {
        id: 'es-test',
        semanticVector: [0.5, 0.5, 0.0, 0.0],
        intentNodes: [
          { id: 'query1', label: 'preguntar', confidence: 0.9, attributes: { type: 'QUERY', semanticPayload: [], conflictMarkers: [] } }
        ],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'es' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'es-hash'
      };

      const reprMap = new Map([
        ['en', englishRepr],
        ['es', spanishRepr]
      ]);

      const validation = await validator.validateConsistency(reprMap);

      const intentMismatch = validation.inconsistencies.find(
        inc => inc.inconsistencyType === InconsistencyType.INTENT_MISMATCH
      );
      expect(intentMismatch).toBeDefined();
    });

    it('should handle compression variance detection', async () => {
      const lowCompressionRepr: SemanticRepresentation = {
        id: 'low-compression',
        semanticVector: [0.3, 0.3, 0.3, 0.1],
        intentNodes: [],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang1' } }],
        compressionRatio: 0.9, // Low compression
        languageAgnosticHash: 'hash1'
      };

      const highCompressionRepr: SemanticRepresentation = {
        id: 'high-compression',
        semanticVector: [0.3, 0.3, 0.3, 0.1],
        intentNodes: [],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang2' } }],
        compressionRatio: 0.1, // High compression
        languageAgnosticHash: 'hash2'
      };

      const reprMap = new Map([
        ['lang1', lowCompressionRepr],
        ['lang2', highCompressionRepr]
      ]);

      const validation = await validator.validateConsistency(reprMap);

      const compressionVariance = validation.inconsistencies.find(
        inc => inc.inconsistencyType === InconsistencyType.COMPRESSION_VARIANCE
      );
      expect(compressionVariance).toBeDefined();
    });
  });

  describe('Correction Mechanisms', () => {
    it('should generate vector alignment corrections for vector divergence', async () => {
      const divergentRepr1: SemanticRepresentation = {
        id: 'repr1',
        semanticVector: [1.0, 0.0, 0.0, 0.0],
        intentNodes: [],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang1' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'hash1'
      };

      const divergentRepr2: SemanticRepresentation = {
        id: 'repr2',
        semanticVector: [0.0, 1.0, 0.0, 0.0],
        intentNodes: [],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang2' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'hash2'
      };

      const reprMap = new Map([
        ['lang1', divergentRepr1],
        ['lang2', divergentRepr2]
      ]);

      const validation = await validator.validateConsistency(reprMap);
      const vectorDivergence = validation.inconsistencies.find(
        inc => inc.inconsistencyType === InconsistencyType.VECTOR_DIVERGENCE
      );

      expect(vectorDivergence).toBeDefined();
      expect(vectorDivergence!.suggestedCorrections.length).toBeGreaterThan(0);
      
      const vectorAlignmentCorrection = vectorDivergence!.suggestedCorrections.find(
        corr => corr.correctionType === CorrectionType.VECTOR_ALIGNMENT
      );
      expect(vectorAlignmentCorrection).toBeDefined();
      expect(vectorAlignmentCorrection!.confidence).toBeGreaterThan(0.5);
    });

    it('should generate intent harmonization corrections for intent mismatches', async () => {
      const goalRepr: SemanticRepresentation = {
        id: 'goal-repr',
        semanticVector: [0.5, 0.5, 0.0, 0.0],
        intentNodes: [
          { id: 'goal1', label: 'achieve', confidence: 0.9, attributes: { type: 'GOAL', semanticPayload: [], conflictMarkers: [] } }
        ],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang1' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'goal-hash'
      };

      const queryRepr: SemanticRepresentation = {
        id: 'query-repr',
        semanticVector: [0.5, 0.5, 0.0, 0.0],
        intentNodes: [
          { id: 'query1', label: 'ask', confidence: 0.9, attributes: { type: 'QUERY', semanticPayload: [], conflictMarkers: [] } }
        ],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang2' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'query-hash'
      };

      const reprMap = new Map([
        ['lang1', goalRepr],
        ['lang2', queryRepr]
      ]);

      const validation = await validator.validateConsistency(reprMap);
      const intentMismatch = validation.inconsistencies.find(
        inc => inc.inconsistencyType === InconsistencyType.INTENT_MISMATCH
      );

      expect(intentMismatch).toBeDefined();
      
      const intentHarmonization = intentMismatch!.suggestedCorrections.find(
        corr => corr.correctionType === CorrectionType.INTENT_HARMONIZATION
      );
      expect(intentHarmonization).toBeDefined();
      expect(intentHarmonization!.reasoning).toContain('harmonization');
    });

    it('should apply corrections and validate results', async () => {
      const inconsistentRepr1: SemanticRepresentation = {
        id: 'inconsistent1',
        semanticVector: [1.0, 0.0, 0.0, 0.0],
        intentNodes: [],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang1' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'hash1'
      };

      const inconsistentRepr2: SemanticRepresentation = {
        id: 'inconsistent2',
        semanticVector: [0.0, 1.0, 0.0, 0.0],
        intentNodes: [],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang2' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'hash2'
      };

      const reprMap = new Map([
        ['lang1', inconsistentRepr1],
        ['lang2', inconsistentRepr2]
      ]);

      const validation = await validator.validateConsistency(reprMap);
      expect(validation.inconsistencies.length).toBeGreaterThan(0);

      // Test correction application
      const inconsistency = validation.inconsistencies[0];
      const corrections = await validator.correctInconsistencies([inconsistency]);
      
      expect(corrections.length).toBeGreaterThan(0);
      expect(corrections[0].success).toBe(true);
      expect(corrections[0].validationAfterCorrection.overallConsistency)
        .toBeGreaterThan(validation.overallConsistency);
    });

    it('should handle manual review cases for complex inconsistencies', async () => {
      // Create a complex inconsistency that should require manual review
      const complexRepr1: SemanticRepresentation = {
        id: 'complex1',
        semanticVector: new Array(128).fill(0).map(() => Math.random()),
        intentNodes: [
          { id: 'complex1', label: 'complex-concept', confidence: 0.3, attributes: { type: 'CONTEXT', semanticPayload: [], conflictMarkers: [] } }
        ],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang1' } }],
        compressionRatio: 0.1,
        languageAgnosticHash: 'complex-hash1'
      };

      const complexRepr2: SemanticRepresentation = {
        id: 'complex2',
        semanticVector: new Array(128).fill(0).map(() => Math.random()),
        intentNodes: [
          { id: 'complex2', label: 'different-concept', confidence: 0.2, attributes: { type: 'EMOTION', semanticPayload: [], conflictMarkers: [] } }
        ],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang2' } }],
        compressionRatio: 0.9,
        languageAgnosticHash: 'complex-hash2'
      };

      const reprMap = new Map([
        ['lang1', complexRepr1],
        ['lang2', complexRepr2]
      ]);

      const validation = await validator.validateConsistency(reprMap);
      
      // Should detect multiple types of inconsistencies
      expect(validation.inconsistencies.length).toBeGreaterThan(0);
      
      // Some corrections should require manual review
      const manualReviewCorrections = validation.inconsistencies
        .flatMap(inc => inc.suggestedCorrections)
        .filter(corr => corr.correctionType === CorrectionType.MANUAL_REVIEW);
      
      expect(manualReviewCorrections.length).toBeGreaterThan(0);
      expect(manualReviewCorrections[0].confidence).toBe(0.0);
    });
  });

  describe('Consistency Metrics', () => {
    it('should generate comprehensive consistency metrics', async () => {
      const repr1: SemanticRepresentation = {
        id: 'metrics1',
        semanticVector: [0.5, 0.5, 0.0, 0.0],
        intentNodes: [],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang1' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'metrics-hash1'
      };

      const repr2: SemanticRepresentation = {
        id: 'metrics2',
        semanticVector: [0.6, 0.4, 0.0, 0.0],
        intentNodes: [],
        sourceReferences: [{ sourceId: 'src1', location: 'loc1', metadata: { language: 'lang2' } }],
        compressionRatio: 0.5,
        languageAgnosticHash: 'metrics-hash2'
      };

      const reprMap = new Map([
        ['lang1', repr1],
        ['lang2', repr2]
      ]);

      const metrics = await validator.generateConsistencyMetrics(Array.from(reprMap.values()));

      expect(metrics.totalLanguagePairs).toBe(1);
      expect(metrics.averageConsistency).toBeGreaterThanOrEqual(0);
      expect(metrics.averageConsistency).toBeLessThanOrEqual(1);
      expect(metrics.validationCoverage).toBeGreaterThan(0);
      expect(metrics.consistencyDistribution.size).toBeGreaterThan(0);
    });

    it('should track validation performance over time', async () => {
      const allReprs: SemanticRepresentation[] = [];
      
      // Generate multiple validations
      for (let i = 0; i < 5; i++) {
        const repr1: SemanticRepresentation = {
          id: `perf1-${i}`,
          semanticVector: new Array(4).fill(0).map(() => Math.random()),
          intentNodes: [],
          sourceReferences: [{ sourceId: `src-${i}`, location: 'loc', metadata: { language: `lang1-${i}` } }],
          compressionRatio: 0.5,
          languageAgnosticHash: `hash1-${i}`
        };

        const repr2: SemanticRepresentation = {
          id: `perf2-${i}`,
          semanticVector: new Array(4).fill(0).map(() => Math.random()),
          intentNodes: [],
          sourceReferences: [{ sourceId: `src-${i}`, location: 'loc', metadata: { language: `lang2-${i}` } }],
          compressionRatio: 0.5,
          languageAgnosticHash: `hash2-${i}`
        };

        allReprs.push(repr1, repr2);
      }

      const metrics = await validator.generateConsistencyMetrics(allReprs);
      
      // 10 distinct languages (lang1-0..4, lang2-0..4) create 45 pairs (10*9/2)
      expect(metrics.totalLanguagePairs).toBe(45);
      expect(metrics.averageConsistency).toBeGreaterThanOrEqual(0);
      expect(metrics.averageConsistency).toBeLessThanOrEqual(1);
    });
  });
});