import logger from '../utils/logger';

export function setupGracefulShutdown(): void {
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to send this to a logging service
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Gracefully shutdown after logging
    process.exit(1);
  });
} 