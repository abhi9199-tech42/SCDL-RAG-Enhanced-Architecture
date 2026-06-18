import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const IngestRequestSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  metadata: z.record(z.string(), z.any()).optional(),
  language: z.string().optional()
});

export const BatchIngestRequestSchema = z.object({
  items: z.array(z.object({
    id: z.string().optional(),
    content: z.string(),
    metadata: z.record(z.string(), z.any()).optional()
  })).min(1, 'Items array must not be empty')
});

export const RetrieveRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().positive().max(100).optional(),
  includeExplanation: z.boolean().optional()
});

export const DetectContradictionsRequestSchema = z.object({
  semanticUnitIds: z.array(z.string()).min(1, 'At least one semanticUnitId is required')
});

export const ValidateMultilangRequestSchema = z.object({
  representations: z.record(z.string(), z.any()).refine(
    (obj: Record<string, unknown>) => Object.keys(obj).length > 0,
    'At least one language representation is required'
  )
});

export const OptimizeCompressionRequestSchema = z.object({
  content: z.string().min(1, 'Content is required')
});

type Schema = z.ZodObject<any>;

export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      const path = firstError.path.join('.');
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: firstError.message,
          details: path ? { field: path } : undefined
        }
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
