/**
 * Storage Service Interface
 * Follows Interface Segregation Principle - focused on file storage operations
 */
export interface IStorageService {
  /**
   * Upload a file to storage
   * @param file Buffer containing file data
   * @param key Unique identifier for the file
   * @param options Upload options
   * @returns URL of the uploaded file
   */
  uploadFile(
    file: Buffer, 
    key: string, 
    options: StorageUploadOptions
  ): Promise<string>;

  /**
   * Delete a file from storage
   * @param key Unique identifier for the file
   * @returns Promise that resolves when deletion is complete
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Get a signed URL for temporary access
   * @param key Unique identifier for the file
   * @param expirySeconds Expiry time in seconds
   * @returns Signed URL
   */
  getSignedUrl(key: string, expirySeconds?: number): Promise<string>;

  /**
   * Check if a file exists
   * @param key Unique identifier for the file
   * @returns True if file exists
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   * @param key Unique identifier for the file
   * @returns File metadata
   */
  getFileMetadata(key: string): Promise<StorageFileMetadata>;
}

export interface StorageUploadOptions {
  mimeType: string;
  contentDisposition?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

export interface StorageFileMetadata {
  size: number;
  mimeType: string;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
} 