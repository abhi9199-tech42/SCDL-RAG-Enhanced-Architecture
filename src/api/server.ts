import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createRoutes } from './routes';
import { ISREProcessorImpl } from '../isre/processor';
import { InMemoryVectorStore } from '../storage/memory_store';
import { IntentAwareRetrievalEngine } from '../retrieval/engine';
import { createRateLimiter, requestId } from './middleware/rateLimit';

import { ISREProcessor } from '../types';
import { VectorStore } from '../storage/types';
import { RetrievalEngine } from '../retrieval/types';

const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : '*';

export const createApp = (
  processor?: ISREProcessor,
  vectorStore?: VectorStore,
  retrievalEngine?: RetrievalEngine,
  enhancedComponents?: any
) => {
  const app = express();

  // Trust proxy for accurate req.ip behind load balancers
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(cors({
    origin: CORS_ORIGINS === '*' ? true : CORS_ORIGINS,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'x-request-id'],
    maxAge: 86400
  }));
  app.use(bodyParser.json({ limit: '10mb' }));

  // Rate limiting (disabled in test mode)
  const isTest = process.env.NODE_ENV === 'test';
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
  if (!isTest) {
    app.use(createRateLimiter({ windowMs, maxRequests }));
  }

  // Use provided instances or create defaults
  const finalProcessor = processor || new ISREProcessorImpl();
  const finalVectorStore = vectorStore || new InMemoryVectorStore();
  const finalRetrievalEngine = retrievalEngine || new IntentAwareRetrievalEngine(finalVectorStore, finalProcessor);

  // Mount Routes with enhanced components
  app.use('/api', createRoutes(finalProcessor, finalVectorStore, finalRetrievalEngine as IntentAwareRetrievalEngine, enhancedComponents));

  // Enhanced error handler with performance monitoring
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = req.headers['x-request-id'] || 'unknown';
    console.error(`[${requestId}] Error:`, err.message || err);
    
    // Record error in performance monitor if available
    if (enhancedComponents?.performanceMonitor) {
      enhancedComponents.performanceMonitor.recordOperation('API_REQUEST', 0, false);
    }
    
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'UNCAUGHT_ERROR', 
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        requestId
      } 
    });
  });
  
  return app;
};
