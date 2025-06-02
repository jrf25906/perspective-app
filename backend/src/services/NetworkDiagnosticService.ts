import { Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * Service responsible for network diagnostics and iOS connectivity troubleshooting
 * Follows Single Responsibility Principle - only handles network diagnostics
 */
export class NetworkDiagnosticService {
  private static connectionAttempts: Map<string, ConnectionAttempt[]> = new Map();
  private static corsViolations: Map<string, CorsViolation[]> = new Map();
  
  /**
   * Log connection attempt for diagnostic purposes
   */
  static logConnectionAttempt(req: Request, success: boolean, error?: Error) {
    const clientInfo = this.extractClientInfo(req);
    const attempt: ConnectionAttempt = {
      timestamp: new Date(),
      clientInfo,
      endpoint: req.path,
      method: req.method,
      success,
      error: error?.message,
      headers: this.sanitizeHeaders(req.headers)
    };
    
    const key = clientInfo.identifier;
    const attempts = this.connectionAttempts.get(key) || [];
    attempts.push(attempt);
    
    // Keep only last 100 attempts per client
    if (attempts.length > 100) {
      attempts.shift();
    }
    
    this.connectionAttempts.set(key, attempts);
    
    // Log iOS-specific issues
    if (clientInfo.platform === 'ios' && !success) {
      logger.warn(`iOS connection failure from ${clientInfo.identifier}: ${error?.message}`);
      
      // Check for common iOS issues
      this.diagnoseIOSIssue(req, error);
    }
  }
  
  /**
   * Log CORS violation for debugging
   */
  static logCorsViolation(req: Request, origin: string) {
    const violation: CorsViolation = {
      timestamp: new Date(),
      origin,
      requestedResource: req.path,
      method: req.method,
      headers: this.sanitizeHeaders(req.headers)
    };
    
    const violations = this.corsViolations.get(origin) || [];
    violations.push(violation);
    
    // Keep only last 50 violations per origin
    if (violations.length > 50) {
      violations.shift();
    }
    
    this.corsViolations.set(origin, violations);
    
    logger.warn(`CORS violation from origin ${origin} accessing ${req.path}`);
  }
  
  /**
   * Extract client information from request
   */
  private static extractClientInfo(req: Request): ClientInfo {
    const userAgent = req.headers['user-agent'] || '';
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    
    // Detect platform
    let platform: 'ios' | 'android' | 'web' | 'unknown' = 'unknown';
    if (userAgent.includes('PerspectiveApp-iOS') || userAgent.includes('perspective/1')) {
      platform = 'ios';
    } else if (userAgent.includes('Android')) {
      platform = 'android';
    } else if (userAgent.includes('Mozilla') || userAgent.includes('Chrome')) {
      platform = 'web';
    }
    
    // Extract version
    const versionMatch = userAgent.match(/PerspectiveApp-iOS\/(\d+\.\d+)/);
    const appVersion = versionMatch ? versionMatch[1] : 'unknown';
    
    return {
      identifier: `${platform}-${req.ip}`,
      platform,
      appVersion,
      userAgent,
      origin,
      ip: req.ip || 'unknown'
    };
  }
  
  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  private static sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  /**
   * Diagnose common iOS connection issues
   */
  private static diagnoseIOSIssue(req: Request, error?: Error) {
    const diagnostics: string[] = [];
    
    // Check for missing Authorization header
    if (!req.headers.authorization && req.path !== '/auth/login') {
      diagnostics.push('Missing Authorization header - ensure token is being sent');
    }
    
    // Check for incorrect Content-Type
    const contentType = req.headers['content-type'];
    if (req.method !== 'GET' && (!contentType || !contentType.includes('application/json'))) {
      diagnostics.push('Missing or incorrect Content-Type header - should be application/json');
    }
    
    // Check for timeout patterns
    if (error?.message.includes('timeout') || error?.message.includes('ETIMEDOUT')) {
      diagnostics.push('Connection timeout - check network connectivity and server responsiveness');
    }
    
    // Check for SSL/TLS issues
    if (error?.message.includes('ECONNREFUSED') || error?.message.includes('ENOTFOUND')) {
      diagnostics.push('Connection refused - verify server URL and port configuration');
    }
    
    if (diagnostics.length > 0) {
      logger.info(`iOS diagnostic hints: ${diagnostics.join('; ')}`);
    }
  }
  
  /**
   * Get diagnostic report for a specific client
   */
  static getClientDiagnostics(identifier: string): ClientDiagnosticReport {
    const attempts = this.connectionAttempts.get(identifier) || [];
    const recentAttempts = attempts.slice(-20); // Last 20 attempts
    
    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter(a => a.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
    
    // Analyze failure patterns
    const failureReasons = attempts
      .filter(a => !a.success && a.error)
      .reduce((acc, a) => {
        acc[a.error!] = (acc[a.error!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return {
      identifier,
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate,
      recentAttempts,
      failureReasons,
      lastSeen: attempts[attempts.length - 1]?.timestamp || null
    };
  }
  
  /**
   * Get CORS violation report
   */
  static getCorsViolationReport(): CorsViolationReport {
    const allViolations: CorsViolation[] = [];
    const violationsByOrigin: Record<string, number> = {};
    
    this.corsViolations.forEach((violations, origin) => {
      allViolations.push(...violations);
      violationsByOrigin[origin] = violations.length;
    });
    
    return {
      totalViolations: allViolations.length,
      violationsByOrigin,
      recentViolations: allViolations.slice(-10),
      uniqueOrigins: Array.from(this.corsViolations.keys())
    };
  }
  
  /**
   * Clear diagnostic data
   */
  static clearDiagnostics() {
    this.connectionAttempts.clear();
    this.corsViolations.clear();
  }
}

// Type definitions
interface ConnectionAttempt {
  timestamp: Date;
  clientInfo: ClientInfo;
  endpoint: string;
  method: string;
  success: boolean;
  error?: string;
  headers: any;
}

interface ClientInfo {
  identifier: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  appVersion: string;
  userAgent: string;
  origin: string;
  ip: string;
}

interface CorsViolation {
  timestamp: Date;
  origin: string;
  requestedResource: string;
  method: string;
  headers: any;
}

interface ClientDiagnosticReport {
  identifier: string;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  recentAttempts: ConnectionAttempt[];
  failureReasons: Record<string, number>;
  lastSeen: Date | null;
}

interface CorsViolationReport {
  totalViolations: number;
  violationsByOrigin: Record<string, number>;
  recentViolations: CorsViolation[];
  uniqueOrigins: string[];
} 