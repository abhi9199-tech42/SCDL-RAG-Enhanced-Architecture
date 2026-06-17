import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { InMemoryAuditTrail } from '../../audit/trail';

describe('Audit Trail Property Tests', () => {
  const auditTrail = new InMemoryAuditTrail();

  const decisionGen = fc.record({
    type: fc.constantFrom('retrieval', 'contradiction_resolution', 'context_assembly'),
    component: fc.string(),
    inputSummary: fc.record({ id: fc.uuid(), data: fc.string() }),
    outcome: fc.record({ id: fc.uuid(), result: fc.string() }),
    reasoning: fc.string(),
    evidence: fc.array(fc.record({
      factor: fc.string(),
      weight: fc.float(),
      description: fc.string(),
      sourceId: fc.option(fc.uuid(), { nil: undefined })
    })),
    confidence: fc.float({ min: 0, max: 1 })
  });

  it('Property 14: Comprehensive Audit Trail Maintenance', async () => {
    // Check that we can log, retrieve, and trace
    await fc.assert(
      fc.asyncProperty(decisionGen, async (decisionData) => {
        // Log
        // Note: decisionData needs to be cast or treated as Omit<DecisionRecord, ...>
        // The structure from gen matches closely enough for runtime usage
        const id = await auditTrail.logDecision(decisionData as any);
        
        // Retrieve
        const record = await auditTrail.getDecision(id);
        expect(record).toBeDefined();
        expect(record?.id).toBe(id);
        expect(record?.reasoning).toBe(decisionData.reasoning);

        // Trace by Input ID
        const inputId = decisionData.inputSummary.id;
        const trace = await auditTrail.getTrace(inputId);
        expect(trace.length).toBeGreaterThan(0);
        expect(trace.some(r => r.id === id)).toBe(true);
        
        // Trace by Outcome ID
        const outcomeId = decisionData.outcome.id;
        const traceOut = await auditTrail.getTrace(outcomeId);
        expect(traceOut.length).toBeGreaterThan(0);
        expect(traceOut.some(r => r.id === id)).toBe(true);
        
        // Explain
        const explanation = await auditTrail.generateExplanation(id);
        expect(explanation).toContain(decisionData.reasoning);
        if (decisionData.evidence.length > 0) {
            expect(explanation).toContain("Key Factors");
        }
      })
    );
  });
});
