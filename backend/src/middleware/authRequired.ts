import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Middleware that requires authentication and automatically sends 401 response if not authenticated
 */
export const authRequired = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }
  next();
}; 