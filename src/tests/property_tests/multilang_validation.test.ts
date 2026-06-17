import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { MultiLanguageValidator } from '../../isre/multilang/validator';
import { SemanticRepresentation } from '../../types';

describe('Property 17: Multi-Language Consistency Validation', () => {
  const validator = new MultiLanguageValidator();

  /**
   * Property 17: Multi-Language Consistency Validation
   * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
   * 
   * For any set of semantic representations across different languages,
   * the consistency validation should:
   * 1. Detect inconsistencies when they exist
   * 2. Provide quantitative consistency metrics
   * 3. Generate appropriate corrections for detected inconsistencies
   * 4. Maintain consistency scores within expected ranges
   */
  it('should maintain consistency validation properties across language pairs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate semantic representations for different languages
        fc.record({
          english: fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            semanticVector: fc.array(fc.float({ min: -1, max: 1, noNaN: true, noInfinity: true }), { minLength: 128, maxLength: 128 }),
            intentNodes: fc.array(fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              label: fc.string({ minLength: 1, maxLength: 20 }),
              confidence: fc.float({ min: 0, max: 1 }),
              attributes: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 20 }))
            }), { maxLength: 5 }),
            sourceReferences: fc.array(fc.record({
              sourceId: fc.string({ minLength: 1, maxLength: 10 }),
              location: fc.string({ minLength: 1, maxLength: 10 }),
              metadata: fc.record({})
            }), { maxLength: 2 }),
            compressionRatio: fc.float({ min: Math.fround(0.1), max: 1.0, noNaN: true }),
            languageAgnosticHash: fc.string({ minLength: 32, maxLength: 64 })
          }),
          spanish: fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            semanticVector: fc.array(fc.float({ min: -1, max: 1, noNaN: true, noInfinity: true }), { minLength: 128, maxLength: 128 }),
            intentNodes: fc.array(fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              label: fc.string({ minLength: 1, maxLength: 20 }),
              confidence: fc.float({ min: 0, max: 1 }),
              attributes: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 20 }))
            }), { maxLength: 5 }),
            sourceReferences: fc.array(fc.record({
              sourceId: fc.string({ minLength: 1, maxLength: 10 }),
              location: fc.string({ minLength: 1, maxLength: 10 }),
              metadata: fc.record({})
            }), { maxLength: 2 }),
            compressionRatio: fc.float({ min: Math.fround(0.1), max: 1.0, noNaN: true }),
            languageAgnosticHash: fc.string({ minLength: 32, maxLength: 64 })
          })
        }),
        async (representations) => {
          // Create representation map
          const reprMap = new Map<string, SemanticRepresentation>([
            ['en', representations.english],
            ['es', representations.spanish]
          ]);

          // Validate consistency
          const validation = await validator.validateConsistency(reprMap);

          // Property 1: Consistency score should be between 0 and 1
          expect(validation.overallConsistency).toBeGreaterThanOrEqual(0);
          expect(validation.overallConsistency).toBeLessThanOrEqual(1);

          // Property 2: Language pair scores should exist for all pairs
          expect(validation.languagePairScores.has('en-es')).toBe(true);
          const pairScore = validation.languagePairScores.get('en-es')!;
          expect(pairScore).toBeGreaterThanOrEqual(0);
          expect(pairScore).toBeLessThanOrEqual(1);

          // Property 3: Validation should have timestamp
          expect(validation.validationTimestamp).toBeInstanceOf(Date);

          // Property 4: If inconsistencies exist, they should have proper structure
          for (const inconsistency of validation.inconsistencies) {
            expect(inconsistency.id).toBeDefined();
            expect(inconsistency.severity).toBeGreaterThanOrEqual(0);
            expect(inconsistency.severity).toBeLessThanOrEqual(1);
            expect(inconsistency.affectedSemanticUnits).toHaveLength(2);
            expect(inconsistency.suggestedCorrections.length).toBeGreaterThan(0);
          }

          // Property 5: Threshold determination should be consistent
          const thresholdsMet = validation.thresholdsMet;
          expect(typeof thresholdsMet).toBe('boolean');

          // Property 6: If consistency is very high, thresholds should likely be met
          if (validation.overallConsistency > 0.9) {
            expect(validation.inconsistencies.length).toBeLessThanOrEqual(1);
          }

          // Property 7: Corrections should be applicable
          for (const inconsistency of validation.inconsistencies) {
            for (const correction of inconsistency.suggestedCorrections) {
              expect(correction.confidence).toBeGreaterThanOrEqual(0);
              expect(correction.confidence).toBeLessThanOrEqual(1);
              expect(correction.reasoning).toBeDefined();
              expect(correction.reasoning.length).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });

  it('should detect semantic drift between language representations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          baseVector: fc.array(fc.float({ min: -1, max: 1, noNaN: true, noInfinity: true }), { minLength: 128, maxLength: 128 }),
          driftAmount: fc.float({ min: 0, max: 2 })
        }),
        async ({ baseVector, driftAmount }) => {
          // Create drifted vector
          const driftedVector = baseVector.map(val => val + (Math.random() - 0.5) * driftAmount);

          const baseRepr: SemanticRepresentation = {
            id: 'base',
            semanticVector: baseVector,
            intentNodes: [],
            sourceReferences: [],
            compressionRatio: 0.5,
            languageAgnosticHash: 'base-hash'
          };

          const driftedRepr: SemanticRepresentation = {
            id: 'drifted',
            semanticVector: driftedVector,
            intentNodes: [],
            sourceReferences: [],
            compressionRatio: 0.5,
            languageAgnosticHash: 'drifted-hash'
          };

          const reprMap = new Map([
            ['base', baseRepr],
            ['drifted', driftedRepr]
          ]);

          const validation = await validator.validateConsistency(reprMap);

          // Property: Higher drift should result in lower consistency
          if (driftAmount > 1.0) {
            expect(validation.overallConsistency).toBeLessThan(0.85);
          }

          // Property: Very low drift should result in high consistency
          if (driftAmount < 0.1) {
            expect(validation.overallConsistency).toBeGreaterThan(0.9);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should generate appropriate corrections for detected inconsistencies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          inconsistencyType: fc.constantFrom('VECTOR_DIVERGENCE', 'INTENT_MISMATCH', 'SEMANTIC_DRIFT'),
          severity: fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) })
        }),
        async ({ inconsistencyType: _inconsistencyType, severity: _severity }) => {
          // Create representations with intentional inconsistency
          const repr1: SemanticRepresentation = {
            id: 'repr1',
            semanticVector: new Array(128).fill(0).map(() => Math.random()),
            intentNodes: [],
            sourceReferences: [],
            compressionRatio: 0.5,
            languageAgnosticHash: 'hash1'
          };

          const repr2: SemanticRepresentation = {
            id: 'repr2',
            semanticVector: new Array(128).fill(0).map(() => Math.random()),
            intentNodes: [],
            sourceReferences: [],
            compressionRatio: 0.5,
            languageAgnosticHash: 'hash2'
          };

          const reprMap = new Map([
            ['lang1', repr1],
            ['lang2', repr2]
          ]);

          const validation = await validator.validateConsistency(reprMap);

          // Property: Corrections should be generated for inconsistencies
          for (const inconsistency of validation.inconsistencies) {
            expect(inconsistency.suggestedCorrections.length).toBeGreaterThan(0);
            
            for (const correction of inconsistency.suggestedCorrections) {
              // Property: Correction confidence should be reasonable
              expect(correction.confidence).toBeGreaterThanOrEqual(0);
              expect(correction.confidence).toBeLessThanOrEqual(1);
              
              // Property: Correction should have reasoning
              expect(correction.reasoning).toBeDefined();
              expect(correction.reasoning.length).toBeGreaterThan(10);
              
              // Property: Corrected representation should be different from original
              expect(correction.correctedRepresentation).not.toEqual(correction.originalRepresentation);
            }
          }
        }
      ),
      { numRuns: 25 }
    );
  });
});