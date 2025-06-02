import { IStorageService } from '../../interfaces/IStorageService';
import { createS3StorageService, S3StorageConfig } from './S3StorageService';
import { createLocalStorageService, LocalStorageConfig } from './LocalStorageService';
import logger from '../../utils/logger';

/**
 * Storage Factory
 * Creates appropriate storage service based on environment configuration
 * Implements Factory Pattern
 */
export class StorageFactory {
  /**
   * Create storage service based on environment
   */
  static createStorageService(): IStorageService {
    const storageType = process.env.STORAGE_TYPE || 'local';
    
    logger.info(`Creating storage service: ${storageType}`);
    
    switch (storageType) {
      case 's3':
        return this.createS3Storage();
      
      case 'local':
      default:
        return this.createLocalStorage();
    }
  }

  /**
   * Create S3 storage service
   */
  private static createS3Storage(): IStorageService {
    const config: S3StorageConfig = {
      bucketName: process.env.AWS_S3_BUCKET || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      cdnDomain: process.env.CDN_DOMAIN,
      endpoint: process.env.AWS_S3_ENDPOINT, // For S3-compatible services
      s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true'
    };

    // Validate required configuration
    if (!config.bucketName || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error('Missing required S3 configuration');
    }

    return createS3StorageService(config);
  }

  /**
   * Create local storage service
   */
  private static createLocalStorage(): IStorageService {
    const config: LocalStorageConfig = {
      uploadDir: process.env.UPLOAD_DIR || './uploads',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    };

    return createLocalStorageService(config);
  }
}

/**
 * Factory function for dependency injection
 */
export function createStorageService(): IStorageService {
  return StorageFactory.createStorageService();
} 