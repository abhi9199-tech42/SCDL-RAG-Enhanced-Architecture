import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createRoutes } from './routes';
import { ISREProcessorImpl } from '../isre/processor';
import { InMemoryVectorStore } from '../storage/memory_store';
import { IntentAwareRetrievalEngine } from '../retrieval/engine';

import { ISREProcessor } from '../types';
import { VectorStore } from '../storage/types';
import { RetrievalEngine } from '../retrieval/types';

export const createApp = (
  processor?: ISREProcessor,
  vectorStore?: VectorStore,
  retrievalEngine?: RetrievalEngine,
  enhancedComponents?: any
) => {
  const app = express();
  
  app.use(cors());
  app.use(bodyParser.json());

  // Use provided instances or create defaults
  const finalProcessor = processor || new ISREProcessorImpl();
  const finalVectorStore = vectorStore || new InMemoryVectorStore();
  const finalRetrievalEngine = retrievalEngine || new IntentAwareRetrievalEngine(finalVectorStore, finalProcessor);

  // Mount Routes with enhanced components
  app.use('/api', createRoutes(finalProcessor, finalVectorStore, finalRetrievalEngine as IntentAwareRetrievalEngine, enhancedComponents));

  // Enhanced error handler with performance monitoring
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    
    // Record error in performance monitor if available
    if (enhancedComponents?.performanceMonitor) {
      enhancedComponents.performanceMonitor.recordOperation('API_REQUEST', 0, false);
    }
    
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'UNCAUGHT_ERROR', 
        message: 'Internal Server Error',
        timestamp: new Date().toISOString()
      } 
    });
  });
  
  return app;
};
