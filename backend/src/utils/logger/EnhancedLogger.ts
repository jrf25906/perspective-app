import winston from 'winston';
import { LogContext } from './LoggerContext';
import { LogMetadata, sanitizeMetadata } from './LogMetadata';

/**
 * Enhanced logger that extends Winston functionality
 * Liskov Substitution Principle: Can be used anywhere winston.Logger is expected
 */
export class EnhancedLogger {
  private winston: winston.Logger;
  private defaultMetadata: Partial<LogMetadata>;

  constructor(winston: winston.Logger, defaultMetadata: Partial<LogMetadata> = {}) {
    this.winston = winston;
    this.defaultMetadata = defaultMetadata;
  }

  /**
   * Create a child logger with additional default metadata
   */
  child(metadata: Partial<LogMetadata>): EnhancedLogger {
    return new EnhancedLogger(this.winston, {
      ...this.defaultMetadata,
      ...metadata
    });
  }

  /**
   * Log an info message with metadata
   */
  info(message: string, metadata?: Partial<LogMetadata>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log a warning message with metadata
   */
  warn(message: string, metadata?: Partial<LogMetadata>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log an error message with metadata
   */
  error(message: string, error?: Error | Partial<LogMetadata>, additionalMetadata?: Partial<LogMetadata>): void {
    let metadata: Partial<LogMetadata>;
    
    if (error instanceof Error) {
      metadata = {
        ...additionalMetadata,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...((error as any).code && { code: (error as any).code }),
          ...((error as any).statusCode && { statusCode: (error as any).statusCode })
        }
      };
    } else {
      metadata = error || {};
    }
    
    this.log('error', message, metadata);
  }

  /**
   * Log a debug message with metadata
   */
  debug(message: string, metadata?: Partial<LogMetadata>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log an HTTP request with metadata
   */
  http(message: string, metadata?: Partial<LogMetadata>): void {
    this.log('http', message, metadata);
  }

  /**
   * Start a performance timer
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    const startTimeISO = new Date(startTime).toISOString();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.info(`${operation} completed`, {
        context: LogContext.PERFORMANCE,
        duration,
        startTime: startTimeISO,
        endTime: new Date(endTime).toISOString(),
        memoryUsage: process.memoryUsage()
      });
    };
  }

  /**
   * Core logging method that applies metadata
   */
  private log(level: string, message: string, metadata?: Partial<LogMetadata>): void {
    const fullMetadata: LogMetadata = {
      ...this.defaultMetadata,
      ...metadata,
      timestamp: new Date().toISOString(),
      context: metadata?.context || this.defaultMetadata.context || LogContext.SERVER,
      module: metadata?.module || this.defaultMetadata.module || 'Unknown'
    };

    // Sanitize sensitive data
    const sanitized = sanitizeMetadata(fullMetadata);

    // Format the log entry
    const logEntry = {
      level,
      message,
      ...sanitized
    };

    // Use Winston's log method
    this.winston.log(logEntry);
  }

  /**
   * Get the underlying Winston logger (for compatibility)
   */
  getWinstonLogger(): winston.Logger {
    return this.winston;
  }

  /**
   * Create a request-scoped logger
   */
  forRequest(correlationId: string, requestId: string, userId?: number): EnhancedLogger {
    return this.child({
      correlationId,
      requestId,
      userId
    });
  }

  /**
   * Create a database operation logger
   */
  forDatabase(operation: string): EnhancedLogger {
    return this.child({
      context: LogContext.DATABASE,
      operation
    });
  }

  /**
   * Create an external API logger
   */
  forExternalApi(service: string): EnhancedLogger {
    return this.child({
      context: LogContext.EXTERNAL_API,
      service
    });
  }
} 