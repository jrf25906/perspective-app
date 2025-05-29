import { Request, Response, NextFunction } from 'express';

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = Math.random().toString(36).substring(2, 15);
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
