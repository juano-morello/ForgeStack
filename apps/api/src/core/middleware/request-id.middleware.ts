/**
 * Request ID Middleware
 * Adds a unique request ID to each request for tracing
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID from header or generate new one
    req.id = (req.headers['x-request-id'] as string) || randomUUID();
    
    // Set response header for tracing
    res.setHeader('x-request-id', req.id);
    
    next();
  }
}

