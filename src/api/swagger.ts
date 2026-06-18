import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SCDL-RAG Enhanced Architecture API',
      version: '1.0.0',
      description: 'Contradiction-aware retrieval system with semantic compression and URCM reasoning',
      contact: {
        name: 'SCDL-RAG Team'
      },
      license: {
        name: 'GPL v3',
        url: 'https://www.gnu.org/licenses/gpl-3.0.html'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API server'
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authentication'
        }
      },
      schemas: {
        SemanticUnit: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            semantics: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                semanticVector: { type: 'array', items: { type: 'number' } },
                compressionRatio: { type: 'number' }
              }
            },
            metadata: { type: 'object' }
          }
        },
        Contradiction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['semantic', 'temporal', 'logical', 'factual'] },
            severity: { type: 'number', minimum: 0, maximum: 1 },
            detectionConfidence: { type: 'number', minimum: 0, maximum: 1 },
            sourceIds: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
                latencyMs: { type: 'number' }
              }
            }
          }
        }
      }
    },
    security: [{ apiKey: [] }]
  },
  apis: ['./src/api/routes.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SCDL-RAG API Docs'
  }));
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export { swaggerSpec };
