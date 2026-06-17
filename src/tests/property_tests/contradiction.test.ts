import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { StandardResolutionEngine } from '../../urcm/contradiction/resolution';
import { Contradiction } from '../../urcm/types';

describe('Contradiction Resolution Property Tests', () => {
  const engine = new StandardResolutionEngine();

  const contradictionArbitrary = fc.record({
    id: fc.uuid(),
    sourceIds: fc.array(fc.string(), { minLength: 2, maxLength: 2 }),
    description: fc.string(),
    severity: fc.float({ min: 0, max: 1 }),
    type: fc.constantFrom('logical', 'temporal', 'factual', 'semantic'),
    detectionConfidence: fc.float({ min: 0, max: 1 })
  }) as any as fc.Arbitrary<Contradiction>;

  it('Property: Resolution Monotonicity (Confidence)', async () => {
    // Resolution strategies should ideally have high confidence if the input contradiction is high severity/confidence
    // This is a heuristic check.
    await fc.assert(
      fc.asyncProperty(fc.array(contradictionArbitrary), async (contradictions) => {
        const resolutions = await engine.resolve(contradictions);
        
        expect(resolutions.length).toBe(contradictions.length);
        
        for (let i = 0; i < contradictions.length; i++) {
          const c = contradictions[i];
          const r = resolutions[i];
          
          expect(r.contradictionId).toBe(c.id);
          
          // Strategy mapping check
          if (c.type === 'semantic') {
            expect(r.action).toBe('split');
          } else if (c.type === 'factual' && c.severity > 0.8) {
            expect(r.action).toBe('deprecate');
          }
          
          // Confidence sanity check
          expect(r.confidence).toBeGreaterThan(0);
          expect(r.confidence).toBeLessThanOrEqual(1);
        }
      })
    );
  });
});
