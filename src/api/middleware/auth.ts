import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.SCDL_API_KEY;

  if (!validApiKey) {
    logger.error('SCDL_API_KEY environment variable is not set');
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_CONFIGURATION_ERROR',
        message: 'API key authentication is not configured'
      }
    });
  }

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn(`Unauthorized API access attempt from ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing API key'
      }
    });
  }

  next();
};
