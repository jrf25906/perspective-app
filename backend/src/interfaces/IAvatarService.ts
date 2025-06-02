import { Express } from 'express';

/**
 * Avatar Service Interface
 * Manages user avatar operations with image processing
 */
export interface IAvatarService {
  /**
   * Upload and process a user's avatar
   * @param userId User ID
   * @param file Uploaded file from multer
   * @returns URL of the processed avatar
   */
  uploadUserAvatar(userId: number, file: Express.Multer.File): Promise<string>;

  /**
   * Delete a user's avatar
   * @param userId User ID
   * @returns Promise that resolves when deletion is complete
   */
  deleteUserAvatar(userId: number): Promise<void>;

  /**
   * Get avatar URL for a user
   * @param userId User ID
   * @returns Avatar URL or null if not set
   */
  getAvatarUrl(userId: number): Promise<string | null>;

  /**
   * Get avatar URL with fallback to Gravatar
   * @param userId User ID
   * @param email User email for Gravatar fallback
   * @param size Size in pixels
   * @returns Avatar URL (uploaded or Gravatar)
   */
  getAvatarUrlWithFallback(
    userId: number, 
    email: string, 
    size?: number
  ): Promise<string>;

  /**
   * Validate uploaded image
   * @param file Uploaded file
   * @throws Error if validation fails
   */
  validateAvatarFile(file: Express.Multer.File): Promise<void>;
}

export interface AvatarProcessingOptions {
  width: number;
  height: number;
  format: 'webp' | 'jpeg' | 'png';
  quality: number;
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface AvatarValidationRules {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
} 