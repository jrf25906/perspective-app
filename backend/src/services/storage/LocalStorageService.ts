import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { IStorageService, StorageUploadOptions, StorageFileMetadata } from '../../interfaces/IStorageService';
import logger from '../../utils/logger';

/**
 * Local Storage Service Implementation
 * Handles file storage operations using local filesystem (for development)
 */
export class LocalStorageService implements IStorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor(config: LocalStorageConfig) {
    this.uploadDir = config.uploadDir;
    this.baseUrl = config.baseUrl;
    
    // Ensure upload directory exists
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Upload file to local storage
   */
  async uploadFile(
    file: Buffer, 
    key: string, 
    options: StorageUploadOptions
  ): Promise<string> {
    try {
      const filePath = path.join(this.uploadDir, key);
      const fileDir = path.dirname(filePath);
      
      // Ensure subdirectories exist
      await fs.mkdir(fileDir, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, file);
      
      // Write metadata
      const metadataPath = `${filePath}.meta.json`;
      await fs.writeFile(metadataPath, JSON.stringify({
        mimeType: options.mimeType,
        uploadedAt: new Date().toISOString(),
        size: file.length,
        metadata: options.metadata || {}
      }, null, 2));
      
      logger.info(`File uploaded to local storage: ${key}`);
      
      // Return public URL
      return `${this.baseUrl}/uploads/${key}`;
    } catch (error) {
      logger.error('Local storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, key);
      const metadataPath = `${filePath}.meta.json`;
      
      // Delete file and metadata
      await Promise.all([
        fs.unlink(filePath).catch(() => {}),
        fs.unlink(metadataPath).catch(() => {})
      ]);
      
      logger.info(`File deleted from local storage: ${key}`);
    } catch (error) {
      logger.error('Local storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get signed URL (returns public URL for local storage)
   */
  async getSignedUrl(key: string, expirySeconds?: number): Promise<string> {
    // For local storage, we'll create a temporary signed token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + (expirySeconds || 3600) * 1000;
    
    // In production, you'd store this token-expiry mapping
    // For now, we'll just return the public URL
    return `${this.baseUrl}/uploads/${key}?token=${token}&expires=${expiry}`;
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<StorageFileMetadata> {
    try {
      const filePath = path.join(this.uploadDir, key);
      const metadataPath = `${filePath}.meta.json`;
      
      const [stats, metadataJson] = await Promise.all([
        fs.stat(filePath),
        fs.readFile(metadataPath, 'utf-8').catch(() => '{}')
      ]);
      
      const metadata = JSON.parse(metadataJson);
      
      return {
        size: stats.size,
        mimeType: metadata.mimeType || 'application/octet-stream',
        lastModified: stats.mtime,
        metadata: metadata.metadata || {}
      };
    } catch (error) {
      logger.error('Local storage metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}

export interface LocalStorageConfig {
  uploadDir: string;
  baseUrl: string;
}

/**
 * Factory function for dependency injection
 */
export function createLocalStorageService(config: LocalStorageConfig): IStorageService {
  return new LocalStorageService(config);
} 