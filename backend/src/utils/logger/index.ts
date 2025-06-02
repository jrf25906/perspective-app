/**
 * Central export point for the enhanced logging system
 * Following Interface Segregation Principle: Clients can import only what they need
 */

export { LogContext, isValidLogContext, getContextDescription } from './LoggerContext';
export { 
  LogMetadata,
  BaseLogMetadata,
  RequestLogMetadata,
  PerformanceLogMetadata,
  ErrorLogMetadata,
  DatabaseLogMetadata,
  ExternalApiLogMetadata,
  isRequestMetadata,
  isPerformanceMetadata,
  isErrorMetadata,
  isDatabaseMetadata,
  isExternalApiMetadata,
  sanitizeMetadata
} from './LogMetadata';
export { EnhancedLogger } from './EnhancedLogger';
export { LoggerFactory } from './LoggerFactory'; 