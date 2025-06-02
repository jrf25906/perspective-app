import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Service responsible for system diagnostics and monitoring
 * Follows Single Responsibility Principle - only handles diagnostics
 */
export class DiagnosticService {
  private static requestMetrics: Map<string, RequestMetric> = new Map();
  private static errorPatterns: Map<string, ErrorPattern> = new Map();
  
  /**
   * Middleware to track request metrics
   */
  static trackRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const route = `${req.method} ${req.route?.path || req.path}`;
      
      // Track response
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        DiagnosticService.recordMetric(route, statusCode, duration);
        
        // Log slow requests
        if (duration > 1000) {
          logger.warn(`Slow request detected: ${route} took ${duration}ms`);
        }
        
        // Log errors with context
        if (statusCode >= 400) {
          DiagnosticService.recordError(route, statusCode, req.body);
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
  
  /**
   * Record request metrics
   */
  private static recordMetric(route: string, statusCode: number, duration: number) {
    const metric = this.requestMetrics.get(route) || {
      route,
      totalRequests: 0,
      totalDuration: 0,
      errorCount: 0,
      successCount: 0,
      averageDuration: 0
    };
    
    metric.totalRequests++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.totalRequests;
    
    if (statusCode >= 400) {
      metric.errorCount++;
    } else {
      metric.successCount++;
    }
    
    this.requestMetrics.set(route, metric);
  }
  
  /**
   * Record error patterns
   */
  private static recordError(route: string, statusCode: number, requestBody: any) {
    const key = `${route}-${statusCode}`;
    const pattern = this.errorPatterns.get(key) || {
      route,
      statusCode,
      occurrences: 0,
      lastOccurrence: new Date(),
      samples: []
    };
    
    pattern.occurrences++;
    pattern.lastOccurrence = new Date();
    
    // Keep last 5 samples for debugging
    if (pattern.samples.length < 5) {
      pattern.samples.push({
        timestamp: new Date(),
        body: this.sanitizeBody(requestBody)
      });
    }
    
    this.errorPatterns.set(key, pattern);
    
    // Alert on repeated errors
    if (pattern.occurrences > 10 && pattern.occurrences % 10 === 0) {
      logger.error(`Repeated error pattern detected: ${route} has failed ${pattern.occurrences} times with status ${statusCode}`);
    }
  }
  
  /**
   * Sanitize request body for logging (remove sensitive data)
   */
  private static sanitizeBody(body: any): any {
    if (!body) return {};
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  /**
   * Get diagnostic report
   */
  static getReport(): DiagnosticReport {
    const metrics = Array.from(this.requestMetrics.values());
    const errors = Array.from(this.errorPatterns.values());
    
    // Calculate health score
    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const healthScore = Math.max(0, 100 - errorRate);
    
    // Find problematic endpoints
    const problematicEndpoints = metrics
      .filter(m => m.errorCount > m.successCount || m.averageDuration > 500)
      .map(m => ({
        route: m.route,
        errorRate: (m.errorCount / m.totalRequests) * 100,
        averageDuration: m.averageDuration
      }));
    
    return {
      healthScore,
      totalRequests,
      totalErrors,
      errorRate,
      metrics,
      errorPatterns: errors,
      problematicEndpoints,
      timestamp: new Date()
    };
  }
  
  /**
   * Reset diagnostics (useful for testing)
   */
  static reset() {
    this.requestMetrics.clear();
    this.errorPatterns.clear();
  }
}

// Type definitions
interface RequestMetric {
  route: string;
  totalRequests: number;
  totalDuration: number;
  errorCount: number;
  successCount: number;
  averageDuration: number;
}

interface ErrorPattern {
  route: string;
  statusCode: number;
  occurrences: number;
  lastOccurrence: Date;
  samples: Array<{
    timestamp: Date;
    body: any;
  }>;
}

interface DiagnosticReport {
  healthScore: number;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  metrics: RequestMetric[];
  errorPatterns: ErrorPattern[];
  problematicEndpoints: Array<{
    route: string;
    errorRate: number;
    averageDuration: number;
  }>;
  timestamp: Date;
} 