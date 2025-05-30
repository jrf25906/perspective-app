import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = randomUUID();
  (req as any).headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

export default requestLogger;
