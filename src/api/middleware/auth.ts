import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.SCDL_API_KEY || 'scdl-default-key-12345';

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
