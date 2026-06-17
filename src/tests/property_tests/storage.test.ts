import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { InMemoryVectorStore } from '../../storage/memory_store';
import { SemanticDeduplicationEngine } from '../../storage/deduplication';
import { SemanticUnit } from '../../types';

describe('Storage and Deduplication Property Tests', () => {
  
  // Generators
  // Avoid zero vectors for cosine similarity stability
  const semanticVectorGen = fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 5, maxLength: 5 })
    .filter(arr => arr.some(v => Math.abs(v) > 1e-6));
  
  const semanticUnitArbitrary = fc.record({
    id: fc.uuid(),
    content: fc.string(),
    semantics: fc.record({
      id: fc.uuid(),
      semanticVector: semanticVectorGen,
      intentNodes: fc.constant([]),
      sourceReferences: fc.constant([]),
      compressionRatio: fc.constant(1),
      languageAgnosticHash: fc.string()
    }),
    sourceReferences: fc.array(fc.record({
      sourceId: fc.uuid(),
      location: fc.string()
    })),
    metadata: fc.constant({})
  }) as any as fc.Arbitrary<SemanticUnit>;

  describe('Vector Store', () => {
    it('Property: Retrieval Consistency', async () => {
      const store = new InMemoryVectorStore();
      
      await fc.assert(
        fc.asyncProperty(semanticUnitArbitrary, async (unit) => {
          await store.clear();
          await store.add(unit);
          
          const retrieved = await store.get(unit.id);
          expect(retrieved).toEqual(unit);
          
          const searchResults = await store.search(unit.semantics.semanticVector, 1);
          expect(searchResults.length).toBe(1);
          expect(searchResults[0].id).toBe(unit.id);
        })
      );
    });
  });

  describe('Semantic Deduplication', () => {
    it('Property 10: Semantic Deduplication with Traceability Preservation', async () => {
      const store = new InMemoryVectorStore();
      const dedup = new SemanticDeduplicationEngine(store, 0.9); // 0.9 threshold

      await fc.assert(
        fc.asyncProperty(semanticUnitArbitrary, async (unit) => {
          await store.clear();
          await store.add(unit);
          
          // Create a duplicate (same vector, different ID/Source)
          const duplicateUnit = {
            ...unit,
            id: 'dup-' + unit.id,
            sourceReferences: [{ sourceId: 'src-2', location: 'loc-2' }]
          };

          const result = await dedup.checkDuplicate(duplicateUnit);
          
          expect(result.isDuplicate).toBe(true);
          expect(result.originalId).toBe(unit.id);
          
          if (result.isDuplicate && result.originalId) {
            const original = await store.get(result.originalId);
            if (original) {
              const merged = await dedup.merge(duplicateUnit, original);
              
              // Verify traceability: merged unit should have sources from both
              expect(merged.sourceReferences.length).toBeGreaterThanOrEqual(original.sourceReferences.length);
              expect(merged.sourceReferences).toEqual(expect.arrayContaining(original.sourceReferences));
              expect(merged.sourceReferences).toEqual(expect.arrayContaining(duplicateUnit.sourceReferences));
            }
          }
        })
      );
    });

    it('Property: Distinctness Preservation', async () => {
      const store = new InMemoryVectorStore();
      const dedup = new SemanticDeduplicationEngine(store, 0.9);

      await fc.assert(
        fc.asyncProperty(semanticUnitArbitrary, semanticUnitArbitrary, async (u1, u2) => {
          await store.clear();
          
          // Ensure vectors are different enough
          u2.semantics.semanticVector = u1.semantics.semanticVector.map(v => -v); 
          
          await store.add(u1);
          const result = await dedup.checkDuplicate(u2);
          
          expect(result.isDuplicate).toBe(false);
        })
      );
    });
  });
});
