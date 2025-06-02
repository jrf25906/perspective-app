import express from 'express';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Static File Middleware
 * Serves uploaded files in development when using local storage
 */
export function setupStaticFiles(app: express.Application): void {
  // Only serve static files if using local storage
  if (process.env.STORAGE_TYPE === 'local' || !process.env.STORAGE_TYPE) {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const absoluteUploadDir = path.resolve(uploadDir);

    // Check if upload directory exists
    if (existsSync(absoluteUploadDir)) {
      // Serve static files from upload directory
      app.use('/uploads', express.static(absoluteUploadDir, {
        // Set cache headers
        maxAge: '1d',
        etag: true,
        lastModified: true,
        
        // Set proper content types
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
          } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
          } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
          }
          
          // Allow cross-origin requests for images
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      }));

      console.log(`📁 Serving static files from: ${absoluteUploadDir}`);
    }
  }
} 