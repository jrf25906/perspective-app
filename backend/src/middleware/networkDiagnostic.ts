import { Request, Response, NextFunction } from 'express';
import { NetworkDiagnosticService } from '../services/NetworkDiagnosticService';

/**
 * Middleware to track network connectivity and diagnose issues
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
export function networkDiagnosticMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Track response completion
    const originalEnd = res.end;
    const originalJson = res.json;
    
    // Flag to track if response was sent
    let responseSent = false;
    let responseError: Error | undefined;
    
    // Override end method
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      responseSent = true;
      
      // Log successful connection
      NetworkDiagnosticService.logConnectionAttempt(req, true);
      
      // Call original end
      return originalEnd.apply(this, args);
    };
    
    // Override json method to catch error responses
    res.json = function(body: any) {
      responseSent = true;
      
      // Check if this is an error response
      if (res.statusCode >= 400) {
        responseError = new Error(body?.error?.message || `HTTP ${res.statusCode}`);
        NetworkDiagnosticService.logConnectionAttempt(req, false, responseError);
      } else {
        NetworkDiagnosticService.logConnectionAttempt(req, true);
      }
      
      return originalJson.call(this, body);
    };
    
    // Handle request errors
    req.on('error', (error: Error) => {
      if (!responseSent) {
        NetworkDiagnosticService.logConnectionAttempt(req, false, error);
      }
    });
    
    // Handle response errors
    res.on('error', (error: Error) => {
      if (!responseSent) {
        NetworkDiagnosticService.logConnectionAttempt(req, false, error);
      }
    });
    
    // Handle timeout
    res.on('timeout', () => {
      if (!responseSent) {
        const timeoutError = new Error('Request timeout');
        NetworkDiagnosticService.logConnectionAttempt(req, false, timeoutError);
      }
    });
    
    next();
  };
}

/**
 * Middleware to check for CORS violations
 */
export function corsViolationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin || req.headers.referer;
    
    if (origin) {
      // Check if origin is allowed (this will be checked by CORS middleware too)
      // We're just logging violations for diagnostics
      const allowedOriginsHeader = res.getHeader('Access-Control-Allow-Origin');
      const allowedOrigins = typeof allowedOriginsHeader === 'string' || Array.isArray(allowedOriginsHeader) 
        ? allowedOriginsHeader 
        : String(allowedOriginsHeader);
      
      if (allowedOrigins && !isOriginAllowed(origin, allowedOrigins)) {
        NetworkDiagnosticService.logCorsViolation(req, origin);
      }
    }
    
    next();
  };
}

/**
 * Check if origin is allowed based on CORS configuration
 */
function isOriginAllowed(origin: string, allowedOrigins: string | string[]): boolean {
  if (allowedOrigins === '*') return true;
  
  if (typeof allowedOrigins === 'string') {
    return origin === allowedOrigins;
  }
  
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin);
  }
  
  return false;
} 