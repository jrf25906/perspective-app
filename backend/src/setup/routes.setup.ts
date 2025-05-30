import { Express } from 'express';
import { serverConfig } from '../config/server.config';
import authRoutes from '../routes/authRoutes';
import challengeRoutes from '../routes/challengeRoutes';
import profileRoutes from '../routes/profileRoutes';
import adminRoutes from '../routes/adminRoutes';
import contentRoutes from '../routes/contentRoutes';
import echoScoreRoutes from '../routes/echoScoreRoutes';
import errorHandler from '../middleware/errorHandler';

export function setupHealthCheck(app: Express): void {
  app.get('/health', async (req, res) => {
    res.status(200).json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: serverConfig.version,
      environment: serverConfig.environment,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });
}

export function setupAPIRoutes(app: Express): void {
  // Main API routes
  app.use('/api/auth', authRoutes);
  // Expose challenge routes without the /api prefix for simplicity
  app.use('/challenge', challengeRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/echo-score', echoScoreRoutes);
}

export function setup404Handler(app: Express): void {
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  });
}

export function setupErrorHandler(app: Express): void {
  app.use(errorHandler);
}

export function setupAllRoutes(app: Express): void {
  setupHealthCheck(app);
  setupAPIRoutes(app);
  setup404Handler(app);
  setupErrorHandler(app);
} 