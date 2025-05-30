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

// Load environment variables
dotenv.config();

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
  });
}

export default app; 