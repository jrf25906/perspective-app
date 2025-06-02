import { Request, Response } from 'express';
import { NetworkDiagnosticService } from '../services/NetworkDiagnosticService';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get network diagnostics for a specific client
 * Useful for debugging iOS connectivity issues
 */
export const getClientDiagnostics = asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Network diagnostics not available in production' });
    return;
  }
  
  const { identifier } = req.params;
  
  if (!identifier) {
    res.status(400).json({ error: 'Client identifier required' });
    return;
  }
  
  const diagnostics = NetworkDiagnosticService.getClientDiagnostics(identifier);
  res.json(diagnostics);
});

/**
 * Get CORS violation report
 */
export const getCorsViolations = asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'CORS diagnostics not available in production' });
    return;
  }
  
  const report = NetworkDiagnosticService.getCorsViolationReport();
  res.json(report);
});

/**
 * Get all iOS clients that have attempted connections
 */
export const getIOSClients = asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Client diagnostics not available in production' });
    return;
  }
  
  // This is a simplified implementation - in production, you'd want to
  // properly expose this through the NetworkDiagnosticService
  const allClients: string[] = [];
  
  // We need to expose this from NetworkDiagnosticService
  // For now, return a helpful message
  res.json({
    message: 'Use /api/diagnostics/network/client/:identifier for specific client diagnostics',
    hint: 'Client identifiers follow the format: {platform}-{ip}',
    examples: [
      'ios-::1',
      'ios-127.0.0.1',
      'web-::1'
    ]
  });
});

/**
 * Test iOS connectivity with detailed diagnostics
 */
export const testIOSConnectivity = asyncHandler(async (req: Request, res: Response) => {
  const userAgent = req.headers['user-agent'] || '';
  const origin = req.headers.origin || req.headers.referer || 'unknown';
  const authorization = req.headers.authorization;
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    connection: {
      protocol: req.protocol,
      host: req.hostname,
      path: req.path,
      method: req.method,
      ip: req.ip,
      ips: req.ips
    },
    headers: {
      userAgent,
      origin,
      contentType: req.headers['content-type'],
      accept: req.headers.accept,
      hasAuthorization: !!authorization
    },
    cors: {
      expectedOrigin: res.getHeader('Access-Control-Allow-Origin'),
      receivedOrigin: origin,
      credentials: res.getHeader('Access-Control-Allow-Credentials')
    },
    platform: {
      isIOS: userAgent.includes('PerspectiveApp-iOS') || userAgent.includes('perspective/1'),
      detected: userAgent.includes('PerspectiveApp-iOS') ? 'ios' : 
                userAgent.includes('Android') ? 'android' : 
                userAgent.includes('Mozilla') ? 'web' : 'unknown'
    },
    recommendations: []
  };
  
  // Add recommendations based on detected issues
  if (!diagnostics.headers.hasAuthorization && req.path !== '/test-connectivity') {
    diagnostics.recommendations.push('Include Authorization header with Bearer token for authenticated endpoints');
  }
  
  if (!diagnostics.headers.contentType?.includes('application/json') && req.method !== 'GET') {
    diagnostics.recommendations.push('Set Content-Type: application/json for POST/PUT requests');
  }
  
  if (diagnostics.platform.isIOS && !origin) {
    diagnostics.recommendations.push('iOS app should include Origin header for CORS');
  }
  
  res.json({
    success: true,
    diagnostics,
    message: 'Connection successful. Review diagnostics for potential issues.'
  });
});

/**
 * Clear diagnostic data
 */
export const clearDiagnostics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Operation not allowed in production' });
    return;
  }
  
  NetworkDiagnosticService.clearDiagnostics();
  res.json({ message: 'Network diagnostics cleared successfully' });
}); 