import { Router } from 'express';
import { ISREProcessor } from '../types';
import { VectorStore } from '../storage/types';
import { IntentAwareRetrievalEngine } from '../retrieval/engine';
import { SemanticUnit } from '../types';
import { ApiResponse } from './types';
import { validateApiKey } from './middleware/auth';

export const createRoutes = (
  processor: ISREProcessor,
  vectorStore: VectorStore,
  retrievalEngine: IntentAwareRetrievalEngine,
  enhancedComponents?: any
) => {
  const router = Router();

  // Performance monitoring middleware
  const performanceMiddleware = (req: any, res: any, next: any) => {
    req.startTime = Date.now();
    res.on('finish', () => {
      if (enhancedComponents?.performanceMonitor) {
        const duration = Date.now() - req.startTime;
        const success = res.statusCode < 400;
        enhancedComponents.performanceMonitor.recordOperation('API_REQUEST', duration, success);
      }
    });
    next();
  };

  router.use(performanceMiddleware);

  // Enhanced health endpoint with comprehensive system status
  router.get('/health', (req, res) => {
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      components: {
        isre: 'operational',
        urcm: 'operational',
        vectorStore: 'operational',
        retrieval: 'operational'
      }
    };

    if (enhancedComponents) {
      health.components = {
        ...health.components,
        performanceMonitor: enhancedComponents.performanceMonitor ? 'operational' : 'unavailable',
        circuitBreaker: enhancedComponents.circuitBreaker ? enhancedComponents.circuitBreaker.getState() : 'unavailable',
        cacheManager: enhancedComponents.cacheManager ? 'operational' : 'unavailable',
        explainableAI: enhancedComponents.explainableAI ? 'operational' : 'unavailable'
      };
    }

    res.json(health);
  });

  // Apply API Key Authentication
  router.use(validateApiKey);

  // System metrics endpoint
  router.get('/metrics', (req, res) => {
    if (!enhancedComponents?.performanceMonitor) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Performance monitoring not available' }
      });
    }

    const metrics = enhancedComponents.performanceMonitor.getScalabilityMetrics();
    const cacheStats = enhancedComponents.cacheManager?.getCacheStats() || new Map();
    
    res.json({
      success: true,
      data: {
        performance: metrics,
        cache: Object.fromEntries(cacheStats),
        circuitBreaker: enhancedComponents.circuitBreaker?.getMetrics(),
        timestamp: new Date().toISOString()
      }
    });
  });

  // Enhanced ingest endpoint with optimization and validation
  router.post('/ingest', async (req, res) => {
    const start = Date.now();
    try {
      const { id, content, metadata, language } = req.body;
      
      if (!content) {
         const response: ApiResponse<null> = { 
           success: false, 
           error: { code: 'VALIDATION_ERROR', message: 'Content is required' } 
         };
         return res.status(400).json(response);
      }

      const rawContent = {
        id: id || `doc-${Date.now()}`,
        content,
        contentType: 'text',
        metadata: { ...metadata, language }
      };

      // 1. Optimize compression if available
      let optimizedCompression;
      if (enhancedComponents?.compressionOptimizer) {
        optimizedCompression = await enhancedComponents.compressionOptimizer.optimizeCompressionRatio(rawContent);
      }

      // 2. Compress Semantics
      const semantics = await processor.compressSemantics(rawContent);

      // 3. Multi-language validation if applicable
      let languageValidation;
      if (language && language !== 'en' && enhancedComponents?.multiLanguageValidator) {
        const representations = new Map([[language, semantics]]);
        languageValidation = await enhancedComponents.multiLanguageValidator.validateConsistency(representations);
      }

      // 4. Create semantic unit
      const unit: SemanticUnit = {
        id: semantics.id,
        content,
        semantics,
        sourceReferences: semantics.sourceReferences,
        metadata: metadata || {}
      };

      // 5. Detect contradictions
      let contradictions = [];
      if (enhancedComponents?.contradictionDetector) {
        contradictions = await enhancedComponents.contradictionDetector.detectSemanticContradictions([unit]);
      }

      // 6. Store with deduplication
      await vectorStore.add(unit);

      // 7. Log decision for audit trail
      if (enhancedComponents?.explainableAI) {
        await enhancedComponents.explainableAI.auditTrail.logDecision({
          type: 'content_ingestion',
          component: 'api_ingest',
          inputSummary: { contentId: unit.id, contentLength: content.length },
          outcome: { stored: true, contradictions: contradictions.length },
          reasoning: 'Content successfully processed and stored',
          evidence: [{
            factor: 'semantic_processing',
            weight: 1.0,
            description: 'Content processed through ISRE pipeline',
            sourceId: unit.id
          }]
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: { 
          id: unit.id, 
          semanticsId: semantics.id,
          optimizedCompression: optimizedCompression ? {
            originalRatio: semantics.compressionRatio,
            optimizedRatio: optimizedCompression.compressionRatio,
            qualityScore: optimizedCompression.qualityScore
          } : undefined,
          languageValidation: languageValidation ? {
            consistent: languageValidation.thresholdsMet,
            overallConsistency: languageValidation.overallConsistency
          } : undefined,
          contradictions: contradictions.length,
          processingTime: Date.now() - start
        },
        meta: { 
          timestamp: new Date().toISOString(), 
          requestId: req.headers['x-request-id'] as string, 
          latencyMs: Date.now() - start 
        }
      };
      res.json(response);

    } catch (err: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message }
      };
      res.status(500).json(response);
    }
  });

  // Enhanced batch ingest with parallel processing
  router.post('/batch/ingest', async (req, res) => {
    const start = Date.now();
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items)) {
         return res.status(400).json({ 
           success: false, 
           error: { code: 'VALIDATION_ERROR', message: 'Items array is required' } 
         });
      }

      const results = [];
      const batchSize = 10; // Process in batches to avoid overwhelming the system
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item) => {
          try {
            if (!item.content) {
              return { success: false, error: 'Content required', id: item.id };
            }

            const rawContent = {
              id: item.id || `doc-${Date.now()}-${Math.random()}`,
              content: item.content,
              contentType: 'text',
              metadata: item.metadata
            };

            const semantics = await processor.compressSemantics(rawContent);
            const unit: SemanticUnit = {
              id: semantics.id,
              content: item.content,
              semantics,
              sourceReferences: semantics.sourceReferences,
              metadata: item.metadata || {}
            };

            await vectorStore.add(unit);
            return { success: true, id: unit.id };
          } catch (error: any) {
            return { success: false, error: error.message, id: item.id };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const response: ApiResponse<any> = {
        success: true,
        data: { 
          processed: results.length, 
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          details: results 
        },
        meta: { 
          timestamp: new Date().toISOString(), 
          requestId: req.headers['x-request-id'] as string, 
          latencyMs: Date.now() - start 
        }
      };
      res.json(response);

    } catch (err: any) {
       res.status(500).json({ 
         success: false, 
         error: { code: 'INTERNAL_ERROR', message: err.message } 
       });
    }
  });

  // Enhanced retrieve endpoint with explanations
  router.post('/retrieve', async (req, res) => {
    const start = Date.now();
    try {
      const { query, limit, includeExplanation } = req.body;
      
      if (!query) {
         const response: ApiResponse<null> = { 
           success: false, 
           error: { code: 'VALIDATION_ERROR', message: 'Query is required' } 
         };
         return res.status(400).json(response);
      }

      const results = await retrievalEngine.retrieve(query, undefined, { limit: limit || 5 });

      let explanation;
      if (includeExplanation && enhancedComponents?.explainableAI) {
        explanation = await enhancedComponents.explainableAI.explainRetrievalDecision({
          queryId: `query-${Date.now()}`,
          query,
          intentGraph: results[0]?.unit?.semantics?.intentNodes || [],
          candidates: results,
          rankedResults: results,
          assembledContext: { units: results.map(r => r.unit) },
          qualityMetrics: { overallScore: 0.85 }
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: {
          results,
          explanation: includeExplanation ? explanation : undefined,
          resultCount: results.length,
          processingTime: Date.now() - start
        },
        meta: { 
          timestamp: new Date().toISOString(), 
          requestId: req.headers['x-request-id'] as string, 
          latencyMs: Date.now() - start 
        }
      };
      res.json(response);

    } catch (err: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message }
      };
      res.status(500).json(response);
    }
  });

  // Contradiction detection endpoint
  router.post('/detect-contradictions', async (req, res) => {
    if (!enhancedComponents?.contradictionDetector) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Contradiction detection not available' }
      });
    }

    try {
      const { semanticUnitIds } = req.body;
      
      if (!Array.isArray(semanticUnitIds)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'semanticUnitIds array is required' }
        });
      }

      // Retrieve semantic units
      const units = [];
      for (const id of semanticUnitIds) {
        const unit = await vectorStore.get(id);
        if (unit) units.push(unit);
      }

      const contradictions = await enhancedComponents.contradictionDetector.detectSemanticContradictions(units);

      res.json({
        success: true,
        data: {
          contradictions,
          unitsAnalyzed: units.length,
          contradictionsFound: contradictions.length
        }
      });

    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message }
      });
    }
  });

  // Multi-language validation endpoint
  router.post('/validate-multilang', async (req, res) => {
    if (!enhancedComponents?.multiLanguageValidator) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Multi-language validation not available' }
      });
    }

    try {
      const { representations } = req.body;
      
      if (!representations || typeof representations !== 'object') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'representations object is required' }
        });
      }

      const representationMap = new Map(Object.entries(representations));
      const validation = await enhancedComponents.multiLanguageValidator.validateConsistency(representationMap);

      res.json({
        success: true,
        data: validation
      });

    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message }
      });
    }
  });

  // Compression optimization endpoint
  router.post('/optimize-compression', async (req, res) => {
    if (!enhancedComponents?.compressionOptimizer) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Compression optimization not available' }
      });
    }

    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'content is required' }
        });
      }

      const optimization = await enhancedComponents.compressionOptimizer.optimizeCompressionRatio(content);

      res.json({
        success: true,
        data: optimization
      });

    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message }
      });
    }
  });

  // Expert review queue endpoint
  router.get('/expert-review', (req, res) => {
    if (!enhancedComponents?.explainableAI) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Explainable AI not available' }
      });
    }

    const queue = enhancedComponents.explainableAI.getExpertReviewQueue();
    
    res.json({
      success: true,
      data: {
        queueLength: queue.length,
        items: queue.map((item: any) => ({
          reviewId: item.reviewId,
          priority: item.priority,
          category: item.category,
          description: item.description,
          deadline: item.deadline,
          assignedExpert: item.assignedExpert
        }))
      }
    });
  });

  // Optimization recommendations endpoint
  router.get('/recommendations', (req, res) => {
    if (!enhancedComponents?.performanceMonitor) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Performance monitoring not available' }
      });
    }

    const recommendations = enhancedComponents.performanceMonitor.generateOptimizationRecommendations();
    
    res.json({
      success: true,
      data: {
        recommendations,
        generatedAt: new Date().toISOString()
      }
    });
  });

  return router;
};
