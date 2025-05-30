import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import config from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'Access token required' 
      } 
    });
  }

  jwt.verify(token, config.security.jwtSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Invalid or expired token' 
        } 
      });
    }

    req.user = user;
    next();
  });
};

export const generateToken = (user: { id: number; email: string; username: string }): string => {
  const payload = { 
    id: user.id, 
    email: user.email, 
    username: user.username 
  };
  
  const options: SignOptions = {
    expiresIn: '7d' // Use direct value for now
  };
  
  return jwt.sign(payload, config.security.jwtSecret, options);
}; 