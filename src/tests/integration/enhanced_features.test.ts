import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SCDLSystemImpl } from '../../system/core';
import { RawContent } from '../../types';

describe('Enhanced Features Integration Tests', () => {
  let system: SCDLSystemImpl;

  beforeEach(async () => {
    system = new SCDLSystemImpl({
      isre: {
        multiLanguage: {
          enabled: true,
          consistencyThreshold: 0.8,
          autoCorrection: true,
          supportedLanguages: ['en', 'es', 'fr']
        },
        compression: {
          optimizationEnabled: true,
          adaptiveCompression: true
        }
      },
      urcm: {
        semanticDetection: {
          enabled: true,
          patternMatching: true,
          domainSpecificRules: true
        }
      },
      performance: {
        monitoring: {
          enabled: true,
          intervalMs: 1000
        }
      },
      audit: {
        enabled: true,
        explainability: {
          enabled: true,
          autoGeneration: true
        }
      }
    });

    await system.initialize();
  });

  afterEach(async () => {
    if (system) {
      await system.shutdown();
    }
  });

  describe('End-to-End Multi-Language Consistency Validation', () => {
    it('should validate consistency across multiple languages', async () => {
      const englishContent: RawContent = {
        id: 'test-en',
        content: 'The quick brown fox jumps over the lazy dog.',
        contentType: 'text',
        metadata: { language: 'en' }
      };

      const spanishContent: RawContent = {
        id: 'test-es',
        content: 'El rápido zorro marrón salta sobre el perro perezoso.',
        contentType: 'text',
        metadata: { language: 'es' }
      };

      // Process both contents
      const englishResult = await system.processWithOptimization(englishContent);
      const spanishResult = await system.processWithOptimization(spanishContent);

      expect(englishResult).toBeDefined();
      expect(spanishResult).toBeDefined();
      expect(englishResult.semantics).toBeDefined();
      expect(spanishResult.semantics).toBeDefined();

      // Validate multi-language consistency
      const representations = new Map([
        ['en', englishResult.semantics],
        ['es', spanishResult.semantics]
      ]);

      const validation = await system.multiLanguageValidator.validateConsistency(representations);

      expect(validation.overallConsistency).toBeGreaterThan(0.5);
      expect(validation.languagePairScores.has('en-es')).toBe(true);
      expect(validation.validationTimestamp).toBeInstanceOf(Date);

      // If inconsistencies are found, corrections should be suggested
      for (const inconsistency of validation.inconsistencies) {
        expect(inconsistency.suggestedCorrections.length).toBeGreaterThan(0);
        expect(inconsistency.severity).toBeGreaterThanOrEqual(0);
        expect(inconsistency.severity).toBeLessThanOrEqual(1);
      }
    });

    it('should handle multi-language correction workflow', async () => {
      const inconsistentContent1: RawContent = {
        id: 'inconsistent-1',
        content: 'The weather is sunny and bright.',
        contentType: 'text',
        metadata: { language: 'en' }
      };

      const inconsistentContent2: RawContent = {
        id: 'inconsistent-2',
        content: 'Il fait sombre et pluvieux.', // Dark and rainy (opposite meaning)
        contentType: 'text',
        metadata: { language: 'fr' }
      };

      const result1 = await system.processWithOptimization(inconsistentContent1);
      const result2 = await system.processWithOptimization(inconsistentContent2);

      const representations = new Map([
        ['en', result1.semantics],
        ['fr', result2.semantics]
      ]);

      const validation = await system.multiLanguageValidator.validateConsistency(representations);

      // Should detect inconsistencies
      expect(validation.inconsistencies.length).toBeGreaterThan(0);
      expect(validation.overallConsistency).toBeLessThan(0.8);

      // Test correction application
      if (validation.inconsistencies.length > 0) {
        const corrections = await system.multiLanguageValidator.correctInconsistencies(validation.inconsistencies);
        
        expect(corrections.length).toBeGreaterThan(0);
        
        for (const correction of corrections) {
          expect(correction.correctionId).toBeDefined();
          expect(correction.appliedCorrection).toBeDefined();
          expect(correction.validationAfterCorrection).toBeDefined();
          
          // Validation after correction should show improvement
          expect(correction.validationAfterCorrection.overallConsistency)
            .toBeGreaterThanOrEqual(validation.overallConsistency);
        }
      }
    });
  });

  describe('End-to-End Compression Optimization Workflow', () => {
    it('should optimize compression ratios during ingestion', async () => {
      const redundantContent: RawContent = {
        id: 'redundant-test',
        content: 'This is a test. This is a test. This is a test. '.repeat(20),
        contentType: 'text',
        metadata: { contentTypeHint: 'TEXT' }
      };

      const result = await system.processWithOptimization(redundantContent);

      expect(result.optimizedCompression).toBeDefined();
      expect(result.optimizedCompression.compressionRatio).toBeLessThan(0.5); // Should compress well
      expect(result.optimizedCompression.qualityScore).toBeGreaterThan(0.7);
      expect(result.optimizedCompression.fidelityMetrics).toBeDefined();
      expect(result.optimizedCompression.fidelityMetrics.semanticPreservation).toBeGreaterThan(0.8);
    });

    it('should adapt compression strategies based on content type', async () => {
      const codeContent: RawContent = {
        id: 'code-test',
        content: `
          function fibonacci(n) {
            if (n <= 1) return n;
            return fibonacci(n - 1) + fibonacci(n - 2);
          }
          
          console.log(fibonacci(10));
        `,
        contentType: 'text',
        metadata: { contentTypeHint: 'CODE' }
      };

      const textContent: RawContent = {
        id: 'text-test',
        content: 'This is regular text content that can be compressed more aggressively than code.',
        contentType: 'text',
        metadata: { contentTypeHint: 'TEXT' }
      };

      const codeResult = await system.processWithOptimization(codeContent);
      const textResult = await system.processWithOptimization(textContent);

      // Code should use high-fidelity strategy
      expect(codeResult.optimizedCompression.optimizationStrategy.strategyName).toBe('high_fidelity');
      expect(codeResult.optimizedCompression.fidelityMetrics.reconstructionAccuracy).toBeGreaterThan(0.9);

      // Text should use more aggressive compression
      expect(textResult.optimizedCompression.compressionRatio).toBeLessThan(codeResult.optimizedCompression.compressionRatio);
    });

    it('should generate optimization recommendations', async () => {
      const suboptimalContent: RawContent = {
        id: 'suboptimal-test',
        content: 'Content that could be optimized better. '.repeat(30),
        contentType: 'text',
        metadata: { 
          currentEfficiency: 0.3,
          targetEfficiency: 0.8
        }
      };

      const recommendations = await system.compressionOptimizer.generateOptimizationRecommendations(suboptimalContent);

      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should have high priority recommendations due to large efficiency gap
      const highPriorityRecs = recommendations.filter(rec => 
        rec.priority === 'HIGH' || rec.priority === 'CRITICAL'
      );
      expect(highPriorityRecs.length).toBeGreaterThan(0);

      for (const rec of recommendations) {
        expect(rec.expectedImprovement).toBeGreaterThan(0);
        expect(rec.description.length).toBeGreaterThan(20);
        expect(rec.implementationComplexity).toBeGreaterThanOrEqual(0);
        expect(rec.implementationComplexity).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('End-to-End Contradiction Detection and Resolution', () => {
    it('should detect and resolve semantic contradictions', async () => {
      const contradictoryContent1: RawContent = {
        id: 'contradiction-1',
        content: 'The sky is blue and clear.',
        contentType: 'text'
      };

      const contradictoryContent2: RawContent = {
        id: 'contradiction-2',
        content: 'The sky is dark and cloudy.',
        contentType: 'text'
      };

      const result1 = await system.processWithOptimization(contradictoryContent1);
      const result2 = await system.processWithOptimization(contradictoryContent2);

      // Create semantic units for contradiction detection
      const unit1 = {
        id: result1.semantics.id,
        content: contradictoryContent1.content,
        semantics: result1.semantics,
        sourceReferences: result1.semantics.sourceReferences,
        metadata: {}
      };

      const unit2 = {
        id: result2.semantics.id,
        content: contradictoryContent2.content,
        semantics: result2.semantics,
        sourceReferences: result2.semantics.sourceReferences,
        metadata: {}
      };

      const contradictions = await system.contradictionDetector.detectSemanticContradictions([unit1, unit2]);

      expect(contradictions.length).toBeGreaterThan(0);
      
      for (const contradiction of contradictions) {
        expect(contradiction.id).toBeDefined();
        expect(contradiction.sourceIds.length).toBe(2);
        expect(contradiction.severity).toBeGreaterThan(0);
        expect(contradiction.detectionConfidence).toBeGreaterThan(0);
      }

      // Test resolution
      if (contradictions.length > 0) {
        const resolutions = await system.urcmProcessor.applyMicroConvergence(contradictions);
        
        expect(resolutions.length).toBeGreaterThan(0);
        
        for (const resolution of resolutions) {
          expect(resolution.contradictionId).toBeDefined();
          expect(resolution.outcome).toMatch(/resolved|flagged|split/);
          expect(resolution.confidence).toBeGreaterThanOrEqual(0);
          expect(resolution.confidence).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should handle domain-specific contradiction rules', async () => {
      const medicalContent1: RawContent = {
        id: 'medical-1',
        content: 'Patient shows signs of hypertension with elevated blood pressure.',
        contentType: 'text',
        metadata: { domain: 'medical' }
      };

      const medicalContent2: RawContent = {
        id: 'medical-2',
        content: 'Patient has normal blood pressure readings.',
        contentType: 'text',
        metadata: { domain: 'medical' }
      };

      const result1 = await system.processWithOptimization(medicalContent1);
      const result2 = await system.processWithOptimization(medicalContent2);

      const unit1 = {
        id: result1.semantics.id,
        content: medicalContent1.content,
        semantics: result1.semantics,
        sourceReferences: result1.semantics.sourceReferences,
        metadata: { domain: 'medical' }
      };

      const unit2 = {
        id: result2.semantics.id,
        content: medicalContent2.content,
        semantics: result2.semantics,
        sourceReferences: result2.semantics.sourceReferences,
        metadata: { domain: 'medical' }
      };

      const contradictions = await system.contradictionDetector.detectSemanticContradictions([unit1, unit2]);

      // Medical domain should have high sensitivity
      if (contradictions.length > 0) {
        const medicalContradictions = contradictions.filter(c => c.type === 'medical');
        expect(medicalContradictions.length).toBeGreaterThan(0);
        
        // Medical contradictions should have high severity
        for (const contradiction of medicalContradictions) {
          expect(contradiction.severity).toBeGreaterThan(0.7);
        }
      }
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should monitor system performance during processing', async () => {
      const testContent: RawContent = {
        id: 'performance-test',
        content: 'Test content for performance monitoring.',
        contentType: 'text'
      };

      const startTime = Date.now();
      const result = await system.processWithOptimization(testContent);
      const endTime = Date.now();

      expect(result.processingTime).toBeLessThan(endTime - startTime + 100); // Allow some tolerance

      // Check performance metrics
      const metrics = system.performanceMonitor.getScalabilityMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.throughput).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
    });

    it('should generate performance optimization recommendations', async () => {
      // Process multiple items to generate performance data
      const contents = Array.from({ length: 5 }, (_, i) => ({
        id: `perf-test-${i}`,
        content: `Performance test content ${i}. `.repeat(10),
        contentType: 'text' as const
      }));

      for (const content of contents) {
        await system.processWithOptimization(content);
      }

      const recommendations = system.performanceMonitor.generateOptimizationRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);

      for (const recommendation of recommendations) {
        expect(recommendation.category).toBeDefined();
        expect(recommendation.priority).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(recommendation.expectedImpact).toBeGreaterThanOrEqual(0);
        expect(recommendation.expectedImpact).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Audit Trail and Explainability Integration', () => {
    it('should maintain comprehensive audit trails', async () => {
      const testContent: RawContent = {
        id: 'audit-test',
        content: 'Content for audit trail testing.',
        contentType: 'text',
        metadata: { source: 'integration-test' }
      };

      const result = await system.processWithOptimization(testContent);

      // Check audit trail
      const auditRecords = system.auditTrail.getDecisionsByEntity(result.semantics.id);
      expect(auditRecords.length).toBeGreaterThan(0);

      for (const record of auditRecords) {
        expect(record.type).toBeDefined();
        expect(record.component).toBeDefined();
        expect(new Date(record.timestamp)).toBeInstanceOf(Date);
        expect(record.inputSummary).toBeDefined();
        expect(record.outcome).toBeDefined();
        expect(record.reasoning).toBeDefined();
      }
    });

    it('should generate explainable AI decisions', async () => {
      const queryContent = 'Find information about machine learning algorithms.';

      const retrievalResult = await system.retrieveWithExplanation(queryContent, {
        includeExplanation: true,
        limit: 3
      });

      expect(retrievalResult).toBeDefined();
      expect(retrievalResult.results).toBeDefined();
      expect(Array.isArray(retrievalResult.results)).toBe(true);

      if (retrievalResult.explanation) {
        expect(retrievalResult.explanation.queryAnalysis).toBeDefined();
        expect(retrievalResult.explanation.retrievalReasoning).toBeDefined();
        expect(retrievalResult.explanation.confidenceFactors).toBeDefined();
        expect(Array.isArray(retrievalResult.explanation.confidenceFactors)).toBe(true);
      }
    });

    it('should handle expert review queue', async () => {
      // Generate a complex scenario that might require expert review
      const complexContent: RawContent = {
        id: 'complex-test',
        content: 'Complex medical diagnosis with multiple contradictory symptoms and uncertain outcomes.',
        contentType: 'text',
        metadata: { 
          domain: 'medical',
          complexity: 0.9,
          confidence: 0.4
        }
      };

      await system.processWithOptimization(complexContent);

      const expertQueue = system.explainableAI.getExpertReviewQueue();
      expect(Array.isArray(expertQueue)).toBe(true);

      // Check if complex medical content was flagged for expert review
      const medicalReviews = expertQueue.filter(item => 
        item.category === 'MEDICAL' || item.description.toLowerCase().includes('medical')
      );

      if (medicalReviews.length > 0) {
        for (const review of medicalReviews) {
          expect(review.reviewId).toBeDefined();
          expect(review.priority).toBeDefined();
          expect(review.description).toBeDefined();
          expect(review.deadline).toBeInstanceOf(Date);
        }
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle circuit breaker activation', async () => {
      // Simulate multiple failures to trigger circuit breaker
      const failingContent: RawContent = {
        id: 'failing-test',
        content: '', // Empty content might cause processing failures
        contentType: 'text'
      };

      let _failures = 0;
      const maxAttempts = 3;

      for (let i = 0; i < maxAttempts; i++) {
        try {
          await system.processWithOptimization(failingContent);
        } catch (error) {
          _failures++;
        }
      }

      // Circuit breaker should be monitoring failures
      const circuitState = system.circuitBreaker.getState();
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(circuitState);

      const metrics = system.circuitBreaker.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.failureCount).toBeGreaterThanOrEqual(0);
      expect(metrics.successCount).toBeGreaterThanOrEqual(0);
    });

    it('should maintain system stability under load', async () => {
      const loadTestContents = Array.from({ length: 10 }, (_, i) => ({
        id: `load-test-${i}`,
        content: `Load test content ${i}. This is a test of system stability under concurrent load.`,
        contentType: 'text' as const
      }));

      // Process all contents concurrently
      const promises = loadTestContents.map(content => 
        system.processWithOptimization(content).catch(error => ({ error }))
      );

      const results = await Promise.all(promises);

      // Most requests should succeed
      const successfulResults = results.filter(result => !('error' in result));
      const failedResults = results.filter(result => 'error' in result);

      expect(successfulResults.length).toBeGreaterThan(failedResults.length);

      // System should still be responsive
      const healthCheck = await system.getSystemHealth();
      expect(healthCheck.status).toBe('operational');
    });
  });
});