import { Request, Response, NextFunction } from 'express';
import { RequestTransformService } from '../services/RequestTransformService';

/**
 * Middleware to transform iOS requests before validation
 * Must run BEFORE validation middleware to ensure proper field names
 */
export function transformRequest(type: 'challengeSubmission' | 'profileUpdate') {
  return (req: Request, res: Response, next: NextFunction) => {
    switch (type) {
      case 'challengeSubmission':
        req.body = RequestTransformService.transformChallengeSubmission(req.body);
        break;
      case 'profileUpdate':
        req.body = RequestTransformService.transformProfileUpdate(req.body);
        break;
    }
    next();
  };
} 