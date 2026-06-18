import { describe, it, expect } from 'vitest';
import { HybridContradictionDetector } from '../../urcm/contradiction/detector';
import { ResonanceEncoder } from '../../urcm/core/resonance';
import { IntentGraph } from '../../types';

describe('HybridContradictionDetector', () => {
  const encoder = new ResonanceEncoder();
  const detector = new HybridContradictionDetector(encoder);

  function makeGraph(nodes: any[]): IntentGraph {
    return {
      nodes,
      edges: [],
      rootIntent: 'test',
      confidenceScore: 1.0
    };
  }

  describe('detect', () => {
    it('should return empty array for graph with no conflicts', async () => {
      const graph = makeGraph([
        { id: 'n1', label: 'A', attributes: {} },
        { id: 'n2', label: 'B', attributes: {} }
      ]);
      const result = await detector.detect(graph);
      expect(result).toEqual([]);
    });

    it('should detect explicit conflict markers', async () => {
      const graph = makeGraph([
        {
          id: 'n1',
          label: 'A',
          attributes: {
            conflictMarkers: [{ partnerId: 'n2', description: 'Direct conflict' }]
          }
        },
        { id: 'n2', label: 'B', attributes: {} }
      ]);
      const result = await detector.detect(graph);
      expect(result.length).toBe(1);
      expect(result[0].severity).toBe(0.9);
      expect(result[0].type).toBe('semantic');
    });

    it('should not duplicate conflicts from both sides', async () => {
      const graph = makeGraph([
        {
          id: 'n1',
          label: 'A',
          attributes: {
            conflictMarkers: [{ partnerId: 'n2', description: 'Conflict' }]
          }
        },
        {
          id: 'n2',
          label: 'B',
          attributes: {
            conflictMarkers: [{ partnerId: 'n1', description: 'Conflict' }]
          }
        }
      ]);
      const result = await detector.detect(graph);
      expect(result.length).toBe(1);
    });

    it('should handle multiple conflicts', async () => {
      const graph = makeGraph([
        {
          id: 'n1',
          label: 'A',
          attributes: {
            conflictMarkers: [
              { partnerId: 'n2', description: 'Conflict 1' },
              { partnerId: 'n3', description: 'Conflict 2' }
            ]
          }
        },
        { id: 'n2', label: 'B', attributes: {} },
        { id: 'n3', label: 'C', attributes: {} }
      ]);
      const result = await detector.detect(graph);
      expect(result.length).toBe(2);
    });

    it('should handle empty graph', async () => {
      const graph = makeGraph([]);
      const result = await detector.detect(graph);
      expect(result).toEqual([]);
    });
  });
});
