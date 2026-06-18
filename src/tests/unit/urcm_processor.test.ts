import { describe, it, expect } from 'vitest';
import { URCMProcessorImpl } from '../../urcm/processor';
import { SemanticRepresentation, IntentGraph, SemanticUnit, Contradiction } from '../../types';

describe('URCMProcessorImpl', () => {
  const processor = new URCMProcessorImpl();

  function makeSemantic(id: string, vector: number[]): SemanticRepresentation {
    return {
      id,
      semanticVector: vector,
      intentNodes: [],
      intentGraph: { nodes: [], edges: [], rootIntent: '', confidenceScore: 1.0 },
      sourceReferences: [],
      compressionRatio: 1.0,
      languageAgnosticHash: id
    };
  }

  describe('mapToFrequencyDomain', () => {
    it('should map semantics to frequency mapping', async () => {
      const semantics = [
        makeSemantic('s1', [1, 0, 0]),
        makeSemantic('s2', [0, 1, 0])
      ];
      const mapping = await processor.mapToFrequencyDomain(semantics);
      expect(mapping.semanticFrequencies.size).toBe(2);
      expect(mapping.semanticFrequencies.get('s1')).toBeDefined();
      expect(mapping.semanticFrequencies.get('s2')).toBeDefined();
      expect(mapping.convergenceThreshold).toBe(0.7);
    });

    it('should handle empty input', async () => {
      const mapping = await processor.mapToFrequencyDomain([]);
      expect(mapping.semanticFrequencies.size).toBe(0);
    });

    it('should compute frequencies based on L2 norm', async () => {
      const semantics = [makeSemantic('s1', [3, 4, 0])];
      const mapping = await processor.mapToFrequencyDomain(semantics);
      expect(mapping.semanticFrequencies.get('s1')).toBeCloseTo(5.0);
    });
  });

  describe('detectResonance', () => {
    it('should find resonance patterns among similar frequencies', async () => {
      const mapping = {
        semanticFrequencies: new Map<string, number>([
          ['s1', 1.0],
          ['s2', 1.001],
          ['s3', 5.0]
        ]),
        resonancePatterns: [],
        convergenceThreshold: 0.7
      };
      const patterns = await processor.detectResonance(mapping);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should return empty for all different frequencies', async () => {
      const mapping = {
        semanticFrequencies: new Map<string, number>([
          ['s1', 1.0],
          ['s2', 5.0],
          ['s3', 10.0]
        ]),
        resonancePatterns: [],
        convergenceThreshold: 0.7
      };
      const patterns = await processor.detectResonance(mapping);
      expect(patterns.length).toBe(0);
    });

    it('should handle empty mapping', async () => {
      const mapping = {
        semanticFrequencies: new Map<string, number>(),
        resonancePatterns: [],
        convergenceThreshold: 0.7
      };
      const patterns = await processor.detectResonance(mapping);
      expect(patterns).toEqual([]);
    });
  });

  describe('applyMicroConvergence', () => {
    it('should resolve contradictions through μ-convergence', async () => {
      const contradictions: Contradiction[] = [{
        id: 'c1',
        sourceIds: ['u1', 'u2'],
        description: 'Test contradiction',
        severity: 0.8,
        type: 'semantic',
        detectionConfidence: 0.9
      }];
      const resolutions = await processor.applyMicroConvergence(contradictions);
      expect(resolutions.length).toBeGreaterThan(0);
      expect(resolutions[0].contradictionId).toBe('c1');
      expect(resolutions[0].outcome).toMatch(/resolved|flagged|split/);
      expect(resolutions[0].confidence).toBeGreaterThan(0);
    });

    it('should handle empty contradictions', async () => {
      const resolutions = await processor.applyMicroConvergence([]);
      expect(resolutions).toEqual([]);
    });
  });

  describe('performOscillatoryReasoning', () => {
    it('should produce coherent context from semantic units', async () => {
      const units: SemanticUnit[] = [{
        id: 'u1',
        content: 'test content',
        semantics: makeSemantic('u1', [0.5, 0.5, 0.5]),
        sourceReferences: [],
        metadata: { source: 'test', timestamp: new Date().toISOString(), domain: 'general' }
      }];
      const result = await processor.performOscillatoryReasoning(units);
      expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
      expect(result.coherenceScore).toBeLessThanOrEqual(1);
      expect(result.units.length).toBe(1);
    });

    it('should handle empty context', async () => {
      const result = await processor.performOscillatoryReasoning([]);
      expect(result.coherenceScore).toBe(1.0);
      expect(result.units).toEqual([]);
    });
  });

  describe('detectContradictions', () => {
    it('should detect contradictions in intent graph', async () => {
      const graph: IntentGraph = {
        nodes: [
          {
            id: 'n1',
            label: 'A',
            confidence: 0.9,
            attributes: { conflictMarkers: [{ partnerId: 'n2', description: 'Conflict' }] }
          },
          { id: 'n2', label: 'B', confidence: 0.9, attributes: {} }
        ],
        edges: [],
        rootIntent: 'test',
        confidenceScore: 1.0
      };
      const contradictions = await processor.detectContradictions(graph);
      expect(contradictions.length).toBeGreaterThan(0);
    });

    it('should detect latent instability for large graphs', async () => {
      const graph: IntentGraph = {
        nodes: Array.from({ length: 5 }, (_, i) => ({
          id: `n${i}`,
          label: `Node ${i}`,
          confidence: 0.9,
          attributes: {}
        })),
        edges: [],
        rootIntent: 'unstable',
        confidenceScore: 1.0
      };
      const contradictions = await processor.detectContradictions(graph);
      expect(Array.isArray(contradictions)).toBe(true);
    });
  });

  describe('resolveContradictions', () => {
    it('should return resolution plans', async () => {
      const contradictions: Contradiction[] = [{
        id: 'c1',
        sourceIds: ['u1', 'u2'],
        description: 'Test',
        severity: 0.8,
        type: 'semantic',
        detectionConfidence: 0.9
      }];
      const plans = await processor.resolveContradictions(contradictions);
      expect(plans.length).toBeGreaterThan(0);
      expect(plans[0].contradictionId).toBe('c1');
    });
  });
});
