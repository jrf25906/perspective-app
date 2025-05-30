import { Request, Response, NextFunction } from 'express';

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(`[${req.requestId}] Error:`, error.stack);

  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  const errorResponse: any = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  res.status(status).json(errorResponse);
};

export default errorHandler;
