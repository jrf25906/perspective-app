import contentIngestionScheduler from '../services/contentIngestionScheduler';

export async function setupSchedulers(): Promise<void> {
  try {
    await contentIngestionScheduler.initialize({
      enabled: process.env.ENABLE_AUTO_INGESTION === 'true',
      schedule: process.env.INGESTION_SCHEDULE || '0 */6 * * *', // Default: every 6 hours
    });
    console.log('Content ingestion scheduler initialized');
  } catch (error) {
    console.error('Failed to initialize content ingestion scheduler:', error);
    // Don't throw - let the server start even if scheduler fails
  }
} 