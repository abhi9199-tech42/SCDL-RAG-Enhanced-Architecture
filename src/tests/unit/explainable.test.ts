import { describe, it, expect } from 'vitest';
import { ExplainableAISystem } from '../../audit/explainable';
import { InMemoryAuditTrail } from '../../audit/trail';

describe('ExplainableAISystem', () => {
  const auditTrail = new InMemoryAuditTrail();
  const explainable = new ExplainableAISystem(auditTrail);

  describe('generateExplanation', () => {
    it('should throw for non-existent decision', async () => {
      await expect(explainable.generateExplanation('non-existent', {})).rejects.toThrow();
    });
  });

  describe('getExpertReviewQueue', () => {
    it('should return expert review queue', () => {
      const queue = explainable.getExpertReviewQueue();
      expect(Array.isArray(queue)).toBe(true);
    });
  });
});
