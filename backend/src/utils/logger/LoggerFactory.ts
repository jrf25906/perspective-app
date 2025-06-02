import winston from 'winston';
import { LogContext } from './LoggerContext';
import { EnhancedLogger } from './EnhancedLogger';

/**
 * Logger Factory for creating context-aware loggers
 * Factory Pattern: Encapsulates logger creation logic
 * Dependency Inversion: Depends on abstractions (interfaces) not concrete implementations
 */
export class LoggerFactory {
  private static winstonLogger: winston.Logger;
  private static enhancedLogger: EnhancedLogger;

  /**
   * Initialize the factory with a Winston logger instance
   */
  static initialize(winstonLogger: winston.Logger): void {
    LoggerFactory.winstonLogger = winstonLogger;
    LoggerFactory.enhancedLogger = new EnhancedLogger(winstonLogger);
  }

  /**
   * Create a context-aware logger for a specific module
   */
  static create(context: LogContext, module: string): EnhancedLogger {
    if (!LoggerFactory.enhancedLogger) {
      throw new Error('LoggerFactory not initialized. Call LoggerFactory.initialize() first.');
    }

    return LoggerFactory.enhancedLogger.child({
      context,
      module
    });
  }

  /**
   * Get the root enhanced logger
   */
  static getLogger(): EnhancedLogger {
    if (!LoggerFactory.enhancedLogger) {
      throw new Error('LoggerFactory not initialized. Call LoggerFactory.initialize() first.');
    }

    return LoggerFactory.enhancedLogger;
  }

  /**
   * Create specialized loggers for common use cases
   */
  static forService(serviceName: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.SERVICE, serviceName);
  }

  static forController(controllerName: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.CONTROLLER, controllerName);
  }

  static forRepository(repositoryName: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.REPOSITORY, repositoryName);
  }

  static forMiddleware(middlewareName: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.MIDDLEWARE, middlewareName);
  }

  static forScript(scriptName: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.SCRIPT, scriptName);
  }

  static forMigration(migrationName: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.MIGRATION, migrationName);
  }

  static forTest(testName: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.TEST, testName);
  }

  /**
   * Create a logger for scheduled jobs with job metadata
   */
  static forScheduledJob(jobName: string, schedule?: string): EnhancedLogger {
    const logger = LoggerFactory.create(LogContext.SCHEDULED_JOB, jobName);
    if (schedule) {
      return logger.child({ schedule });
    }
    return logger;
  }

  /**
   * Create a logger for external API integrations
   */
  static forExternalApi(serviceName: string, baseUrl?: string): EnhancedLogger {
    const logger = LoggerFactory.create(LogContext.EXTERNAL_API, serviceName);
    if (baseUrl) {
      return logger.child({ baseUrl });
    }
    return logger;
  }

  /**
   * Create a performance logger with automatic timing
   */
  static forPerformance(operation: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.PERFORMANCE, operation);
  }

  /**
   * Create a diagnostic logger for system health checks
   */
  static forDiagnostic(component: string): EnhancedLogger {
    return LoggerFactory.create(LogContext.DIAGNOSTIC, component);
  }
} 