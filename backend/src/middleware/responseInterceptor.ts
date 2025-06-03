import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    correlationId?: string;
    validationErrors?: any[];
    details?: any;
  };
}

/**
 * Response interceptor middleware to ensure consistent error formatting
 * Follows Single Responsibility Principle - only handles response formatting
 */
export function responseInterceptor(req: Request, res: Response, next: NextFunction): void {
  // Store original json method
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  // Generate correlation ID if not present
  const correlationId = req.headers['x-correlation-id'] as string || 
    req.headers['x-request-id'] as string || 
    generateCorrelationId();
  
  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Override json method
  res.json = function(data: any): Response {
    // Ensure consistent error structure for error responses
    if (res.statusCode >= 400) {
      if (data && !data.error) {
        // Transform non-standard error responses
        const errorResponse: ErrorResponse = {
          error: {
            code: determineErrorCode(res.statusCode, data),
            message: extractErrorMessage(data),
            correlationId
          }
        };
        
        // Add validation errors if present
        if (data.validationErrors || data.errors) {
          errorResponse.error.validationErrors = data.validationErrors || data.errors;
        }
        
        // Add details if present and not redundant
        if (data.details && typeof data.details === 'object') {
          errorResponse.error.details = data.details;
        }
        
        data = errorResponse;
      } else if (data && data.error) {
        // Ensure error has correlation ID
        data.error.correlationId = data.error.correlationId || correlationId;
        
        // Ensure error has code
        if (!data.error.code) {
          data.error.code = determineErrorCode(res.statusCode, data.error);
        }
      }
    }
    
    // Log response for debugging
    if (res.statusCode >= 400) {
      logger.error('Error response', {
        correlationId,
        statusCode: res.statusCode,
        path: req.path,
        method: req.method,
        error: data.error || data
      });
    }
    
    // Call original json method
    return originalJson(data);
  };
  
  // Override send method for non-JSON responses
  res.send = function(data: any): Response {
    // If sending non-JSON error response, convert to JSON
    if (res.statusCode >= 400 && typeof data === 'string') {
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        error: {
          code: determineErrorCode(res.statusCode, {}),
          message: data,
          correlationId
        }
      });
    }
    
    // Call original send method
    return originalSend(data);
  };
  
  next();
}

/**
 * Generate a unique correlation ID
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine error code based on status code and data
 */
function determineErrorCode(statusCode: number, data: any): string {
  // Check if data already has a code
  if (data.code && typeof data.code === 'string') {
    return data.code;
  }
  
  // Map status codes to error codes
  switch (statusCode) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
  }
}

/**
 * Extract error message from various data formats
 */
function extractErrorMessage(data: any): string {
  // If data is a string, use it directly
  if (typeof data === 'string') {
    return data;
  }
  
  // Check common error message properties
  if (data.message) {
    return data.message;
  }
  
  if (data.error && typeof data.error === 'string') {
    return data.error;
  }
  
  if (data.error && data.error.message) {
    return data.error.message;
  }
  
  if (data.msg) {
    return data.msg;
  }
  
  if (data.reason) {
    return data.reason;
  }
  
  if (data.detail) {
    return data.detail;
  }
  
  // If data is an array (validation errors), join them
  if (Array.isArray(data)) {
    return data.map(err => err.message || err.msg || err).join(', ');
  }
  
  // Default message
  return 'An error occurred';
}

/**
 * Error correlation middleware to track errors across requests
 */
export function errorCorrelationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate or extract correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || 
    req.headers['x-request-id'] as string || 
    generateCorrelationId();
  
  // Attach to request for use in logging
  (req as any).correlationId = correlationId;
  
  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
}