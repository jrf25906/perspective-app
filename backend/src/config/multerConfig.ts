import multer from 'multer';
import { Request } from 'express';

/**
 * Multer Configuration
 * Handles file upload settings and validation
 */

// File filter for images only
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Memory storage for processing before upload to final destination
const storage = multer.memoryStorage();

// Multer configuration
export const avatarUpload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1 // Only 1 file at a time
  }
});

// Export single file upload middleware
export const uploadSingleAvatar = avatarUpload.single('avatar'); 