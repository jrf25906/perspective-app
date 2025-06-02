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

// Error handling for port conflicts
const handlePortConflict = (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${serverConfig.port} is already in use. Attempting graceful shutdown...`);
    
    // Try to find and kill the process using the port
    const { exec } = require('child_process');
    exec(`lsof -ti:${serverConfig.port} | xargs kill -9`, (err) => {
      if (err) {
        logger.error('Failed to kill process on port. Please manually stop the process.');
        logger.error('Run: lsof -ti:3000 | xargs kill -9');
      } else {
        logger.info('Killed previous process. Retrying in 2 seconds...');
        setTimeout(() => {
          const server = app.listen(serverConfig.port, () => {
            logger.info(`🚀 Server running on port ${serverConfig.port}`);
            logger.info(`📊 Environment: ${serverConfig.environment}`);
            logger.info(`🔒 Security: Enhanced middleware enabled`);
            logger.info(`🏥 Health check: http://localhost:${serverConfig.port}/health`);
            logger.info(`⚡ Rate limiting: Enabled`);
            logger.info(`💉 Dependency injection: Configured`);
          });
        }, 2000);
      }
    });
  } else {
    throw error;
  }
};

// Start server with error handling
const server = app.listen(serverConfig.port, () => {
  logger.info(`🚀 Server running on port ${serverConfig.port}`);
  logger.info(`📊 Environment: ${serverConfig.environment}`);
  logger.info(`🔒 Security: Enhanced middleware enabled`);
  logger.info(`🏥 Health check: http://localhost:${serverConfig.port}/health`);
  logger.info(`⚡ Rate limiting: Enabled`);
  logger.info(`💉 Dependency injection: Configured`);
}).on('error', handlePortConflict);

export default app; 