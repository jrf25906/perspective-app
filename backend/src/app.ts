import express, { Application } from 'express';
import { 
  setupAllMiddleware, 
  setupMaintenanceMiddleware,
  setupAllRoutes
} from './setup';
import { registerServices } from './di/serviceRegistration';
import { container } from './di/container';
import logger from './utils/logger';

export interface AppConfig {
  registerDefaultServices?: boolean;
}

/**
 * Creates and configures an Express application
 * @param config Application configuration
 * @returns Configured Express application
 */
export function createApp(config: AppConfig = {}): Application {
  const { registerDefaultServices = true } = config;

  // Clear existing services (useful for testing)
  container.clear();

  // Register services if requested
  if (registerDefaultServices) {
    logger.info('🔧 Initializing dependency injection container...');
    registerServices();
  }

  // Create Express application
  const app = express();

  // Setup middleware
  setupAllMiddleware(app);

  // Setup routes
  setupAllRoutes(app);

  // Setup maintenance middleware (after routes)
  setupMaintenanceMiddleware(app);

  return app;
}

/**
 * Creates a test application with mocked services
 * @returns Express application configured for testing
 */
export function createTestApp(): Application {
  return createApp({ registerDefaultServices: false });
} 