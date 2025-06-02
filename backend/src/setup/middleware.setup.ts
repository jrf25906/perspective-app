import { Express } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { serverConfig, isTest, isDevelopment } from '../app-config/server.config';
import { helmetConfig, generalLimiter, authLimiter } from '../app-config/security.config';
import requestLogger from '../middleware/requestLogger';
import { validateApiResponse } from '../middleware/validateApiResponse';
import { camelCaseRequestParser } from '../middleware/camelCaseRequestParser';
import { networkDiagnosticMiddleware, corsViolationMiddleware } from '../middleware/networkDiagnostic';

export function setupSecurityMiddleware(app: Express): void {
  // Helmet security middleware
  app.use(helmet(helmetConfig));
  
  // CORS configuration
  app.use(cors(serverConfig.cors));
  
  // Apply rate limiting
  app.use('/api/', generalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/password-reset', authLimiter);
}

export function setupLoggingMiddleware(app: Express): void {
  if (!isTest) {
    // Log errors in all environments
    app.use(morgan('combined', {
      skip: (req, res) => res.statusCode < 400,
    }));
    
    // Log all requests in development
    if (isDevelopment) {
      app.use(morgan('dev'));
    }
  }
}

export function setupBodyParsingMiddleware(app: Express): void {
  app.use(express.json({ 
    limit: serverConfig.bodyParser.jsonLimit,
    verify: (req, res, buf) => {
      // Store raw body for webhook verification if needed
      (req as any).rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: serverConfig.bodyParser.urlencodedLimit 
  }));
  
  // Parse camelCase requests from iOS after body parsing
  app.use(camelCaseRequestParser);
}

export function setupRequestMiddleware(app: Express): void {
  // Request ID and timing middleware
  app.use(requestLogger);
  
  // Network diagnostic middleware (before other middleware to catch all requests)
  app.use(networkDiagnosticMiddleware());
  
  // CORS violation tracking (after CORS middleware is applied)
  app.use(corsViolationMiddleware());
  
  // API response validation middleware (only in development)
  if (isDevelopment) {
    app.use(validateApiResponse);
    console.log('✅ API response validation middleware enabled');
  }
}

export function setupMaintenanceMiddleware(app: Express): void {
  app.use((req: any, res: any, next: any) => {
    if (serverConfig.maintenance.enabled) {
      return res.status(503).json({
        error: {
          code: 'MAINTENANCE_MODE',
          message: 'The application is currently under maintenance. Please try again later.',
          estimatedResolution: serverConfig.maintenance.endTime
        }
      });
    }
    next();
  });
}

export function setupAllMiddleware(app: Express): void {
  setupSecurityMiddleware(app);
  setupLoggingMiddleware(app);
  setupBodyParsingMiddleware(app);
  setupRequestMiddleware(app);
  // Note: Maintenance middleware should be added after routes
} 