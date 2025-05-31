import { container, ServiceTokens } from '../di/container';

import logger from '../utils/logger';
export async function setupSchedulers(): Promise<void> {
  const contentIngestionScheduler = container.get(ServiceTokens.ContentIngestionScheduler);
  try {
    await contentIngestionScheduler.initialize({
      enabled: process.env.ENABLE_AUTO_INGESTION === 'true',
      schedule: process.env.INGESTION_SCHEDULE || '0 */6 * * *', // Default: every 6 hours
    });
    logger.info('Content ingestion scheduler initialized');
  } catch (error) {
    logger.error('Failed to initialize content ingestion scheduler:', error);
    // Don't throw - let the server start even if scheduler fails
  }
} 