import { LogContext } from './LoggerContext';

/**
 * Core metadata that all log entries should have
 * Open/Closed Principle: This interface is closed for modification but open for extension
 */
export interface BaseLogMetadata {
  context: LogContext;
  module: string;
  timestamp?: string; // ISO string, auto-added if not provided
}

/**
 * Request-scoped metadata for tracing
 */
export interface RequestLogMetadata extends BaseLogMetadata {
  correlationId: string;
  requestId: string;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Performance-related metadata
 */
export interface PerformanceLogMetadata extends BaseLogMetadata {
  duration: number; // milliseconds
  startTime: string; // ISO string
  endTime: string; // ISO string
  memoryUsage?: NodeJS.MemoryUsage;
}

/**
 * Error-specific metadata
 */
export interface ErrorLogMetadata extends BaseLogMetadata {
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
    statusCode?: number;
    cause?: any;
  };
  operation?: string;
  input?: any; // Sanitized input that caused the error
}

/**
 * Database operation metadata
 */
export interface DatabaseLogMetadata extends BaseLogMetadata {
  query?: string;
  params?: any[];
  duration?: number;
  rowCount?: number;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION' | 'OTHER';
}

/**
 * External API call metadata
 */
export interface ExternalApiLogMetadata extends BaseLogMetadata {
  service: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
}

/**
 * Flexible metadata type that allows extension
 * This is our main type that supports all metadata types plus custom fields
 */
export type LogMetadata = BaseLogMetadata & {
  [key: string]: any;
};

/**
 * Type guards for specific metadata types
 */
export function isRequestMetadata(metadata: LogMetadata): metadata is RequestLogMetadata {
  return 'correlationId' in metadata && 'requestId' in metadata;
}

export function isPerformanceMetadata(metadata: LogMetadata): metadata is PerformanceLogMetadata {
  return 'duration' in metadata && 'startTime' in metadata && 'endTime' in metadata;
}

export function isErrorMetadata(metadata: LogMetadata): metadata is ErrorLogMetadata {
  return 'error' in metadata && typeof metadata.error === 'object';
}

export function isDatabaseMetadata(metadata: LogMetadata): metadata is DatabaseLogMetadata {
  return metadata.context === LogContext.DATABASE && 'operation' in metadata;
}

export function isExternalApiMetadata(metadata: LogMetadata): metadata is ExternalApiLogMetadata {
  return metadata.context === LogContext.EXTERNAL_API && 'service' in metadata && 'endpoint' in metadata;
}

/**
 * Sanitize sensitive data from metadata
 */
export function sanitizeMetadata(metadata: LogMetadata): LogMetadata {
  const sensitive = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...metadata };
  
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const result = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key in result) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object') {
        result[key] = sanitizeObject(result[key]);
      }
    }
    
    return result;
  };
  
  return sanitizeObject(sanitized);
} 