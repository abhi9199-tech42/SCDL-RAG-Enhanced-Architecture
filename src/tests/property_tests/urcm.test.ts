import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ResonanceEncoder } from '../../urcm/core/resonance';
import { AttractorNetwork } from '../../urcm/core/attractor';
import { SemanticRepresentation } from '../../types';

describe('URCM Property Tests', () => {

  describe('Resonance Conservation', () => {
    const encoder = new ResonanceEncoder();

    // Custom arbitrary that avoids zero vectors and NaNs
    const semanticVectorArbitrary = fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 10, maxLength: 10 })
      .filter(arr => arr.some(v => Math.abs(v) > 1e-6));

    const semanticRepArbitrary = fc.record({
      id: fc.uuid(),
      semanticVector: semanticVectorArbitrary,
      intentNodes: fc.constant([]),
      sourceReferences: fc.constant([]),
      compressionRatio: fc.constant(0.5),
      languageAgnosticHash: fc.string()
    }) as any as fc.Arbitrary<SemanticRepresentation>;

    it('Property: Resonance Symmetry', async () => {
      await fc.assert(
        fc.asyncProperty(semanticRepArbitrary, semanticRepArbitrary, async (rep1, rep2) => {
          const r1 = await encoder.calculateResonance(rep1, rep2);
          const r2 = await encoder.calculateResonance(rep2, rep1);

          expect(r1.coherence).toBeCloseTo(r2.coherence);
          expect(r1.intensity).toBeCloseTo(r2.intensity);
        })
      );
    });

    it('Property: Self-Resonance Maximization', async () => {
      await fc.assert(
        fc.asyncProperty(semanticRepArbitrary, async (rep) => {
          const res = await encoder.calculateResonance(rep, rep);
          expect(res.coherence).toBeCloseTo(1.0);
          expect(res.intensity).toBeCloseTo(1.0);
        })
      );
    });
  });

  describe('Cognitive Mesh Stability', () => {
    
    it('Property: Attractor Network Synchronization', () => {
      // Test that a coupled network eventually increases synchronization (Order Parameter increases)
      // or stays high if already synchronized.
      fc.assert(
        fc.property(fc.integer({ min: 5, max: 20 }), (size) => {
          const network = new AttractorNetwork(size, 5.0); // Strong coupling
          
          const initialOrder = network.getOrderParameter();
          
          // Evolve
          for (let i = 0; i < 100; i++) {
            network.step(0.05);
          }
          
          const finalOrder = network.getOrderParameter();
          
          // It should either be already synchronized (high order) or have increased synchronization
          // Or at least not dropped significantly if it started random (random is usually near 0)
          if (initialOrder < 0.9) {
            expect(finalOrder).toBeGreaterThanOrEqual(initialOrder);
          } else {
            expect(finalOrder).toBeGreaterThan(0.8); // Stay synchronized
          }
        })
      );
    });
  });
});
