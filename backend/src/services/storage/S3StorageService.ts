import AWS from 'aws-sdk';
import { IStorageService, StorageUploadOptions, StorageFileMetadata } from '../../interfaces/IStorageService';
import logger from '../../utils/logger';

/**
 * S3 Storage Service Implementation
 * Handles file storage operations using AWS S3
 */
export class S3StorageService implements IStorageService {
  private s3: AWS.S3;
  private bucketName: string;
  private cdnDomain?: string;

  constructor(config: S3StorageConfig) {
    this.bucketName = config.bucketName;
    this.cdnDomain = config.cdnDomain;

    this.s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
      endpoint: config.endpoint, // For S3-compatible services
      s3ForcePathStyle: config.s3ForcePathStyle
    });
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Buffer, 
    key: string, 
    options: StorageUploadOptions
  ): Promise<string> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: options.mimeType,
        ContentDisposition: options.contentDisposition,
        CacheControl: options.cacheControl || 'max-age=31536000', // 1 year
        ACL: options.acl || 'public-read',
        Metadata: options.metadata || {}
      };

      const result = await this.s3.upload(params).promise();
      
      logger.info(`File uploaded to S3: ${key}`);
      
      // Return CDN URL if configured, otherwise S3 URL
      return this.cdnDomain 
        ? `https://${this.cdnDomain}/${key}`
        : result.Location;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expirySeconds
      });
      
      return url;
    } catch (error) {
      logger.error('S3 signed URL error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string): Promise<StorageFileMetadata> {
    try {
      const response = await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      return {
        size: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag,
        metadata: response.Metadata
      };
    } catch (error) {
      logger.error('S3 metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}

export interface S3StorageConfig {
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string; // For S3-compatible services like MinIO
  s3ForcePathStyle?: boolean;
  cdnDomain?: string; // CloudFront or other CDN domain
}

/**
 * Factory function for dependency injection
 */
export function createS3StorageService(config: S3StorageConfig): IStorageService {
  return new S3StorageService(config);
} 