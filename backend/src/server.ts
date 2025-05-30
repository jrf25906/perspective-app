import { createApp } from './app';
import { serverConfig, isTest } from './app-config';
import { 
  setupSchedulers,
  setupGracefulShutdown
} from './setup';

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
  app.listen(serverConfig.port, () => {
    if (isSimpleMode) {
      console.log(`Simple TypeScript server running on port ${serverConfig.port}`);
      console.log(`Environment: ${serverConfig.environment}`);
      console.log(`Auth endpoints available at http://localhost:${serverConfig.port}/api/auth/`);
    } else {
      console.log(`🚀 Server running on port ${serverConfig.port}`);
      console.log(`📊 Environment: ${serverConfig.environment}`);
      console.log(`🔒 Security: Enhanced middleware enabled`);
      console.log(`🏥 Health check: http://localhost:${serverConfig.port}/health`);
      console.log(`⚡ Rate limiting: Enabled`);
      console.log(`💉 Dependency injection: Configured`);
    }
  });
}

export default app; 