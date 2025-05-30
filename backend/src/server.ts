import express from 'express';
import dotenv from 'dotenv';
import { serverConfig, isTest } from './app-config';
import { 
  setupAllMiddleware, 
  setupMaintenanceMiddleware,
  setupAllRoutes,
  setupSchedulers,
  setupGracefulShutdown
} from './setup';
import { registerServices } from './di/serviceRegistration';

// Load environment variables
dotenv.config();

// Initialize dependency injection container
console.log('🔧 Initializing dependency injection container...');
registerServices();

// Create Express application
const app = express();

// Setup middleware
setupAllMiddleware(app);

// Setup routes
setupAllRoutes(app);

// Setup maintenance middleware (after routes)
setupMaintenanceMiddleware(app);

// Setup graceful shutdown
setupGracefulShutdown();

// Initialize schedulers
setupSchedulers();

// Start server
if (!isTest) {
  app.listen(serverConfig.port, () => {
    console.log(`🚀 Server running on port ${serverConfig.port}`);
    console.log(`📊 Environment: ${serverConfig.environment}`);
    console.log(`🔒 Security: Enhanced middleware enabled`);
    console.log(`🏥 Health check: http://localhost:${serverConfig.port}/health`);
    console.log(`⚡ Rate limiting: Enabled`);
    console.log(`💉 Dependency injection: Configured`);
  });
}

export default app; 