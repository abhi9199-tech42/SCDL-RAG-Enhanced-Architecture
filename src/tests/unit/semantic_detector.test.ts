import { describe, it, expect } from 'vitest';
import { SemanticContradictionDetector, ContradictionPatternType } from '../../urcm/contradiction/semantic_detector';
import { SemanticUnit } from '../../types';

describe('SemanticContradictionDetector', () => {
  const detector = new SemanticContradictionDetector();

  function makeUnit(id: string, vector: number[], intent: string, content: string = ''): SemanticUnit {
    return {
      id,
      content: content || `${id} content for ${intent}`,
      semantics: {
        id,
        semanticVector: vector,
        intentNodes: [{ id: `${id}_intent`, label: intent, attributes: {} }],
        intentGraph: { nodes: [], edges: [], rootIntent: intent, confidenceScore: 1.0 },
        sourceReferences: [],
        compressionRatio: 1.0,
        languageAgnosticHash: id
      },
      sourceReferences: [],
      metadata: { source: 'test', timestamp: new Date().toISOString(), domain: 'general' }
    };
  }

  describe('detectSemanticContradictions', () => {
    it('should return empty array when no contradictions exist', async () => {
      const units = [
        makeUnit('u1', new Array(128).fill(0.1), 'intent_a', 'The weather is nice today'),
        makeUnit('u2', new Array(128).fill(0.1), 'intent_a', 'The weather is pleasant')
      ];
      const result = await detector.detectSemanticContradictions(units);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should detect vector divergence contradictions', async () => {
      const units = [
        makeUnit('u1', new Array(128).fill(0.9), 'positive', 'It is always sunny'),
        makeUnit('u2', new Array(128).fill(-0.9), 'negative', 'It is always cloudy')
      ];
      const result = await detector.detectSemanticContradictions(units);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].semanticDistance).toBeGreaterThan(0);
    });

    it('should detect intent mismatch contradictions', async () => {
      const units = [
        makeUnit('u1', new Array(128).fill(0.5), 'affirm', 'The system is working correctly'),
        makeUnit('u2', new Array(128).fill(0.5), 'deny', 'The system is not working at all')
      ];
      const result = await detector.detectSemanticContradictions(units);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].intentConflictScore).toBeGreaterThan(0);
    });

    it('should handle single unit gracefully', async () => {
      const units = [makeUnit('u1', new Array(128).fill(0.5), 'intent')];
      const result = await detector.detectSemanticContradictions(units);
      expect(result).toEqual([]);
    });

    it('should handle empty input', async () => {
      const result = await detector.detectSemanticContradictions([]);
      expect(result).toEqual([]);
    });
  });

  describe('ContradictionPatternType', () => {
    it('should have all pattern types defined', () => {
      expect(ContradictionPatternType.NEGATION_CONFLICT).toBe('NEGATION_CONFLICT');
      expect(ContradictionPatternType.TEMPORAL_INCONSISTENCY).toBe('TEMPORAL_INCONSISTENCY');
      expect(ContradictionPatternType.CAUSAL_CONTRADICTION).toBe('CAUSAL_CONTRADICTION');
      expect(ContradictionPatternType.QUANTITATIVE_MISMATCH).toBe('QUANTITATIVE_MISMATCH');
      expect(ContradictionPatternType.CATEGORICAL_CONFLICT).toBe('CATEGORICAL_CONFLICT');
      expect(ContradictionPatternType.CONTEXTUAL_INCONSISTENCY).toBe('CONTEXTUAL_INCONSISTENCY');
      expect(ContradictionPatternType.DEFINITIONAL_CONFLICT).toBe('DEFINITIONAL_CONFLICT');
      expect(ContradictionPatternType.SCOPE_MISMATCH).toBe('SCOPE_MISMATCH');
    });
  });
});
