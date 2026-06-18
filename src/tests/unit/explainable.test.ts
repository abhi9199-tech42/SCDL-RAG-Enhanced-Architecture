import { describe, it, expect } from 'vitest';
import { ExplainableAISystem } from '../../audit/explainable';
import { InMemoryAuditTrail } from '../../audit/trail';

describe('ExplainableAISystem', () => {
  const auditTrail = new InMemoryAuditTrail();
  const explainable = new ExplainableAISystem(auditTrail);

  describe('generateExplanation', () => {
    it('should throw for non-existent decision', async () => {
      await expect(explainable.generateExplanation('non-existent')).rejects.toThrow('No decision record found');
    });
  });

  describe('getExpertReviewQueue', () => {
    it('should return expert review queue', async () => {
      const queue = await explainable.getExpertReviewQueue();
      expect(Array.isArray(queue)).toBe(true);
    });
  });
});
