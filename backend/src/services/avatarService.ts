import { Express } from 'express';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { Knex } from 'knex';
import { IAvatarService, AvatarProcessingOptions, AvatarValidationRules } from '../interfaces/IAvatarService';
import { IStorageService } from '../interfaces/IStorageService';
import logger from '../utils/logger';

/**
 * Avatar Service Implementation
 * Manages user avatars with image processing and storage
 */
export class AvatarService implements IAvatarService {
  private readonly processingOptions: AvatarProcessingOptions = {
    width: 200,
    height: 200,
    format: 'webp',
    quality: 85,
    fit: 'cover'
  };

  private readonly validationRules: AvatarValidationRules = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    minWidth: 100,
    minHeight: 100,
    maxWidth: 4096,
    maxHeight: 4096
  };

  constructor(
    private db: Knex,
    private storageService: IStorageService
  ) {}

  /**
   * Upload and process user avatar
   */
  async uploadUserAvatar(userId: number, file: Express.Multer.File): Promise<string> {
    try {
      // Validate file
      await this.validateAvatarFile(file);

      // Process image
      const processedImage = await this.processImage(file.buffer);

      // Generate unique key
      const key = this.generateAvatarKey(userId);

      // Delete old avatar if exists
      await this.deleteExistingAvatar(userId);

      // Upload to storage
      const url = await this.storageService.uploadFile(
        processedImage,
        key,
        {
          mimeType: `image/${this.processingOptions.format}`,
          contentDisposition: 'inline',
          cacheControl: 'public, max-age=31536000', // 1 year
          metadata: {
            userId: userId.toString(),
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
          },
          acl: 'public-read'
        }
      );

      // Update database
      await this.updateUserAvatarUrl(userId, url);

      logger.info(`Avatar uploaded for user ${userId}: ${url}`);
      return url;
    } catch (error) {
      logger.error(`Avatar upload failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user avatar
   */
  async deleteUserAvatar(userId: number): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user?.avatar_url) {
        return;
      }

      // Extract key from URL
      const key = this.extractKeyFromUrl(user.avatar_url);
      if (key) {
        await this.storageService.deleteFile(key);
      }

      // Clear database
      await this.updateUserAvatarUrl(userId, null);

      logger.info(`Avatar deleted for user ${userId}`);
    } catch (error) {
      logger.error(`Avatar deletion failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get avatar URL for user
   */
  async getAvatarUrl(userId: number): Promise<string | null> {
    const user = await this.getUser(userId);
    return user?.avatar_url || null;
  }

  /**
   * Get avatar URL with Gravatar fallback
   */
  async getAvatarUrlWithFallback(
    userId: number, 
    email: string, 
    size: number = 200
  ): Promise<string> {
    // Check for uploaded avatar
    const avatarUrl = await this.getAvatarUrl(userId);
    if (avatarUrl) {
      return avatarUrl;
    }

    // Fall back to Gravatar
    return this.getGravatarUrl(email, size);
  }

  /**
   * Validate avatar file
   */
  async validateAvatarFile(file: Express.Multer.File): Promise<void> {
    // Check file size
    if (file.size > this.validationRules.maxSizeBytes) {
      throw new Error(`File size exceeds ${this.validationRules.maxSizeBytes / 1024 / 1024}MB limit`);
    }

    // Check mime type
    if (!this.validationRules.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${this.validationRules.allowedMimeTypes.join(', ')}`);
    }

    // Check image dimensions
    try {
      const metadata = await sharp(file.buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image file');
      }

      if (metadata.width < this.validationRules.minWidth || 
          metadata.height < this.validationRules.minHeight) {
        throw new Error(`Image must be at least ${this.validationRules.minWidth}x${this.validationRules.minHeight} pixels`);
      }

      if (metadata.width > this.validationRules.maxWidth || 
          metadata.height > this.validationRules.maxHeight) {
        throw new Error(`Image must not exceed ${this.validationRules.maxWidth}x${this.validationRules.maxHeight} pixels`);
      }
    } catch (error) {
      if (error.message.includes('Image')) {
        throw error;
      }
      throw new Error('Invalid image file');
    }
  }

  /**
   * Process image with Sharp
   */
  private async processImage(buffer: Buffer): Promise<Buffer> {
    const options = this.processingOptions;

    let pipeline = sharp(buffer)
      .resize(options.width, options.height, {
        fit: options.fit,
        position: 'center',
        withoutEnlargement: false
      });

    // Convert to specified format
    switch (options.format) {
      case 'webp':
        pipeline = pipeline.webp({ quality: options.quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: options.quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: options.quality });
        break;
    }

    return await pipeline.toBuffer();
  }

  /**
   * Generate unique avatar key
   */
  private generateAvatarKey(userId: number): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `avatars/${userId}/${timestamp}-${random}.${this.processingOptions.format}`;
  }

  /**
   * Extract storage key from URL
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      // Handle different URL formats
      if (url.includes('/avatars/')) {
        const match = url.match(/avatars\/[\d]+\/[\w-]+\.\w+/);
        return match ? match[0] : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Delete existing avatar
   */
  private async deleteExistingAvatar(userId: number): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (user?.avatar_url) {
        const key = this.extractKeyFromUrl(user.avatar_url);
        if (key) {
          await this.storageService.deleteFile(key).catch(() => {
            // Ignore errors, old file might not exist
          });
        }
      }
    } catch (error) {
      logger.warn(`Failed to delete old avatar for user ${userId}:`, error);
    }
  }

  /**
   * Get user from database
   */
  private async getUser(userId: number): Promise<any> {
    return await this.db('users')
      .where('id', userId)
      .first();
  }

  /**
   * Update user avatar URL in database
   */
  private async updateUserAvatarUrl(userId: number, url: string | null): Promise<void> {
    await this.db('users')
      .where('id', userId)
      .update({
        avatar_url: url,
        updated_at: new Date()
      });
  }

  /**
   * Generate Gravatar URL
   */
  private getGravatarUrl(email: string, size: number = 200): string {
    const hash = crypto
      .createHash('md5')
      .update(email.toLowerCase().trim())
      .digest('hex');
    
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  }
}

/**
 * Factory function for dependency injection
 */
export function createAvatarService(
  db: Knex,
  storageService: IStorageService
): IAvatarService {
  return new AvatarService(db, storageService);
} 