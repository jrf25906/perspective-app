import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

type AsyncRouteHandler = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps async route handlers to automatically catch errors
 */
export const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 