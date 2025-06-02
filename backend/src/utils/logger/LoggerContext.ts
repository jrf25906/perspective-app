/**
 * Logger contexts for categorizing log entries
 * Following Single Responsibility Principle - this enum's sole purpose is to define log contexts
 */
export enum LogContext {
  // Core application contexts
  SERVER = 'SERVER',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  
  // Business logic contexts
  SERVICE = 'SERVICE',
  REPOSITORY = 'REPOSITORY',
  CONTROLLER = 'CONTROLLER',
  
  // Infrastructure contexts
  MIDDLEWARE = 'MIDDLEWARE',
  VALIDATION = 'VALIDATION',
  CACHE = 'CACHE',
  
  // Operational contexts
  SCRIPT = 'SCRIPT',
  MIGRATION = 'MIGRATION',
  SCHEDULED_JOB = 'SCHEDULED_JOB',
  
  // Testing contexts
  TEST = 'TEST',
  TEST_SETUP = 'TEST_SETUP',
  
  // External integration contexts
  EXTERNAL_API = 'EXTERNAL_API',
  STORAGE = 'STORAGE',
  
  // Diagnostic contexts
  DIAGNOSTIC = 'DIAGNOSTIC',
  PERFORMANCE = 'PERFORMANCE'
}

/**
 * Type guard to check if a string is a valid LogContext
 */
export function isValidLogContext(context: string): context is LogContext {
  return Object.values(LogContext).includes(context as LogContext);
}

/**
 * Get a human-readable description for a log context
 */
export function getContextDescription(context: LogContext): string {
  const descriptions: Record<LogContext, string> = {
    [LogContext.SERVER]: 'Server initialization and lifecycle',
    [LogContext.DATABASE]: 'Database operations and queries',
    [LogContext.AUTHENTICATION]: 'Authentication and authorization',
    [LogContext.SERVICE]: 'Business logic services',
    [LogContext.REPOSITORY]: 'Data access layer',
    [LogContext.CONTROLLER]: 'HTTP request handlers',
    [LogContext.MIDDLEWARE]: 'Express middleware',
    [LogContext.VALIDATION]: 'Input validation',
    [LogContext.CACHE]: 'Caching operations',
    [LogContext.SCRIPT]: 'Utility scripts',
    [LogContext.MIGRATION]: 'Database migrations',
    [LogContext.SCHEDULED_JOB]: 'Cron jobs and scheduled tasks',
    [LogContext.TEST]: 'Test execution',
    [LogContext.TEST_SETUP]: 'Test environment setup',
    [LogContext.EXTERNAL_API]: 'External API calls',
    [LogContext.STORAGE]: 'File storage operations',
    [LogContext.DIAGNOSTIC]: 'System diagnostics',
    [LogContext.PERFORMANCE]: 'Performance monitoring'
  };
  
  return descriptions[context] || 'Unknown context';
} 