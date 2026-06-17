import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TextSemanticCompressor } from '../../isre/compression/text';
import { IntentGraphBuilder } from '../../isre/graph/builder';
import { SemanticPrimitive, IntentType, EdgeType } from '../../isre/types';

describe('ISRE Property Tests', () => {
  
  describe('Semantic Compression', () => {
    const compressor = new TextSemanticCompressor();

    it('Property 2: Semantic Compression Determinism', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (text) => {
          const res1 = await compressor.compress(text);
          const res2 = await compressor.compress(text);
          expect(res1).toEqual(res2);
        })
      );
    });

    it('Property 1: Cross-Language Semantic Consistency (Multi-word)', async () => {
      const pairs = [
        ["apple run", "pomme run"],
        ["run quickly", "run quickly"],
        ["manzana run", "apple run"]
      ];

      for (const [p1, p2] of pairs) {
        const res1 = await compressor.compress(p1);
        const res2 = await compressor.compress(p2);

        expect(res1.length).toBe(res2.length);
        for (let i = 0; i < res1.length; i++) {
          expect(res1[i].concept).toBe(res2[i].concept);
        }
      }
    });

    it('Property 3: Grammar-Free Semantic Extraction', async () => {
      const res1 = await compressor.compress("Apple.");
      const res2 = await compressor.compress("apple");
      
      expect(res1[0].concept).toBe("fruit");
      expect(res2[0].concept).toBe("fruit");
      expect(res1[0].concept).toBe(res2[0].concept);
    });
  });

  describe('Intent Graph Construction', () => {
    const builder = new IntentGraphBuilder();

    const semanticPrimitiveArbitrary = fc.record({
      id: fc.uuid(),
      concept: fc.constantFrom("fruit", "action_move_fast", "attribute_fast", "attribute_slow", "must_be_cold", "random_concept"),
      semanticWeight: fc.float({ min: 0, max: 1 }),
      modality: fc.constant("text"),
      compressionMetadata: fc.constant({})
    });

    it('Property 4: Intent Graph Completeness', async () => {
      const primitives: SemanticPrimitive[] = [
        { id: "1", concept: "action_goal", semanticWeight: 1, modality: "text", compressionMetadata: {} },
        { id: "2", concept: "must_be_fast", semanticWeight: 1, modality: "text", compressionMetadata: {} },
        { id: "3", concept: "apple", semanticWeight: 1, modality: "text", compressionMetadata: {} }
      ];

      const graph = await builder.buildFromPrimitives(primitives);

      // Check all primitives processed into nodes
      expect(graph.nodes.length).toBe(3);

      // Check for expected node types
      const nodeTypes = graph.nodes.map(n => n.attributes.type);
      expect(nodeTypes).toContain(IntentType.GOAL); // action_goal -> GOAL
      // must_be_fast -> CONSTRAINT (if implemented) or CONTEXT depending on logic
      // In builder.ts: "must" -> CONSTRAINT
      expect(nodeTypes).toContain(IntentType.CONSTRAINT);

      // Check edges exist
      expect(graph.edges.length).toBeGreaterThanOrEqual(2);
      const edgeTypes = graph.edges.map(e => e.relationType);
      expect(edgeTypes).toContain(EdgeType.TEMPORAL);
    });

    it('Property 5: Conflict Explicit Representation', async () => {
      const primitives: SemanticPrimitive[] = [
        { id: "fast", concept: "action_move_fast", semanticWeight: 1, modality: "text", compressionMetadata: {} },
        { id: "slow", concept: "action_move_slow", semanticWeight: 1, modality: "text", compressionMetadata: {} }
      ];

      const graph = await builder.buildFromPrimitives(primitives);
      
      const nodeFast = graph.nodes.find(n => n.id === "node_fast")!;
      const nodeSlow = graph.nodes.find(n => n.id === "node_slow")!;

      expect(nodeFast.attributes.conflictMarkers.length).toBeGreaterThan(0);
      expect(nodeSlow.attributes.conflictMarkers.length).toBeGreaterThan(0);
      
      expect(nodeFast.attributes.conflictMarkers[0].partnerId).toBe(nodeSlow.id);
      expect(nodeSlow.attributes.conflictMarkers[0].partnerId).toBe(nodeFast.id);
    });

    it('Graph Builder Robustness', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(semanticPrimitiveArbitrary, { minLength: 1, maxLength: 10 }), async (primitives) => {
          const graph = await builder.buildFromPrimitives(primitives);
          
          expect(graph.nodes.length).toBe(primitives.length);
          if (primitives.length > 1) {
            expect(graph.edges.length).toBeGreaterThanOrEqual(primitives.length - 1);
          }
        })
      );
    });
  });
});
