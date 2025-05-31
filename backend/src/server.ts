import { createApp } from './app';
import { serverConfig, isTest } from './app-config';
import { 
  setupSchedulers,
  setupGracefulShutdown
} from './setup';
import logger from './utils/logger';

// Check if we're running in simple mode
const isSimpleMode = process.env.SIMPLE_MODE === 'true' || process.argv.includes('--simple');

// Create Express application
const app = createApp({ registerDefaultServices: !isSimpleMode });

// Only setup additional features in full mode and not in test environment
if (!isSimpleMode && !isTest) {
  // Setup graceful shutdown
  setupGracefulShutdown();

  // Initialize schedulers
  setupSchedulers();
}

// Start server
if (!isTest) {
  const server = app.listen(serverConfig.port, () => {
    logger.info(`🚀 Server running on port ${serverConfig.port}`);
    logger.info(`📊 Environment: ${serverConfig.environment}`);
    logger.info(`🔒 Security: Enhanced middleware enabled`);
    logger.info(`🏥 Health check: http://localhost:${serverConfig.port}/health`);
    logger.info(`⚡ Rate limiting: Enabled`);
    logger.info(`💉 Dependency injection: Configured`);
  });
}

export default app; 