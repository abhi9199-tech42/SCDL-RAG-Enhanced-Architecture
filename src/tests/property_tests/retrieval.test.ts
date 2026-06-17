import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { IntentAwareRetrievalEngine } from '../../retrieval/engine';
import { InMemoryVectorStore } from '../../storage/memory_store';
import { ISREProcessorImpl } from '../../isre/processor';
import { SemanticUnit } from '../../types';

describe('Intent-Aware Retrieval Property Tests', () => {
  const store = new InMemoryVectorStore();
  const processor = new ISREProcessorImpl();
  const engine = new IntentAwareRetrievalEngine(store, processor);

  // Helper generators
  // Use non-empty strings to ensure ISRE produces something
  const contentGen = fc.string({ minLength: 5 }).filter(s => s.trim().length > 0);
  
  const semanticVectorGen = fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 5, maxLength: 5 })
      .filter(arr => arr.some(v => Math.abs(v) > 1e-6));

  const semanticUnitArbitrary = fc.record({
    id: fc.uuid(),
    content: contentGen,
    semantics: fc.record({
      id: fc.uuid(),
      semanticVector: semanticVectorGen,
      intentNodes: fc.array(fc.record({
        id: fc.uuid(),
        label: fc.string({ minLength: 1 }), 
        confidence: fc.float(),
        attributes: fc.constant({})
      }), { minLength: 1, maxLength: 3 }),
      sourceReferences: fc.constant([]),
      compressionRatio: fc.constant(1),
      languageAgnosticHash: fc.string()
    }),
    sourceReferences: fc.constant([]),
    metadata: fc.constant({})
  }) as any as fc.Arbitrary<SemanticUnit>;

  it('Property 8: Intent-Aware Retrieval Consistency', async () => {
    // We need to ensure targetUnit's semantics actually match its content
    // so that when we query with content, the generated query intent matches the stored unit's intent.
    
    await fc.assert(
      fc.asyncProperty(contentGen, async (content) => {
        await store.clear();
        
        // 1. Generate semantics using the REAL processor
        // This ensures content <-> semantics consistency
        const semantics = await processor.compressSemantics({
          id: 'test-doc',
          content: content,
          contentType: 'text'
        });
        
        // Also need the graph for intent nodes
        const graph = await processor.constructIntentGraph(semantics);
        semantics.intentNodes = graph.nodes; // Attach nodes to semantics
        
        const targetUnit: SemanticUnit = {
          id: 'unit-' + Date.now(),
          content: content,
          semantics: semantics,
          sourceReferences: [],
          metadata: {}
        };
        
        await store.add(targetUnit);
        
        // 2. Query with the same content
        const results = await engine.retrieve(content);
        
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].unit.id).toBe(targetUnit.id);
        
        // If content generated nodes, alignment should be > 0
        if (graph.nodes.length > 0) {
           expect(results[0].metrics.intentAlignment).toBeGreaterThan(0);
        }
      })
    );
  });

  it('Property 9: Intent-Based Ranking Correctness', async () => {
    // For this test, we artificially construct units to isolate Intent Alignment.
    // We don't need content consistency here because we are explicitly setting the stored semantics
    // and querying with an explicit intent label that matches one but not the other.
    
    await fc.assert(
      fc.asyncProperty(semanticUnitArbitrary, semanticUnitArbitrary, async (unitA, unitB) => {
        // Ensure IDs are distinct to prevent overwriting in the store
        unitB.id = unitA.id + '-B';
        unitB.semantics.id = unitA.semantics.id + '-B';

        // Force Unit A and B to have same vector
        unitB.semantics.semanticVector = [...unitA.semantics.semanticVector]; 
        
        // Make Unit A's intent distinct from B's
        // Use simple labels that ISREProcessor is likely to respect if we query them directly
        // OR better: we can mock the processor? No, let's use the fact that ISRE processes words.
        unitA.semantics.intentNodes = [{ id: '1', label: 'TARGET', confidence: 1, attributes: {} }];
        unitB.semantics.intentNodes = [{ id: '2', label: 'NOPE', confidence: 1, attributes: {} }];
        
        await store.clear();
        await store.add(unitA);
        await store.add(unitB);
        
        // Query "TARGET"
        // Processor should generate a node "TARGET" (or close to it)
        const results = await engine.retrieve("TARGET");
        
        // A should win if intent alignment is significant
        expect(results.length).toBe(2);
        expect(results[0].unit.id).toBe(unitA.id);
        
        // Only check alignment if the query successfully generated alignment scores
        if (results[0].metrics.intentAlignment > 0 || results[1].metrics.intentAlignment > 0) {
           expect(results[0].metrics.intentAlignment).toBeGreaterThanOrEqual(results[1].metrics.intentAlignment);
        }
      })
    );
  });
});
