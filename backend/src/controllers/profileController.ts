import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/UserService';
import { UserTransformService } from '../services/UserTransformService';
import { EchoScoreTransformService } from '../services/EchoScoreTransformService';
import { UpdateProfileRequest, ProfileUpdateResponse } from '../models/User';
import { EchoScoreController } from './echoScoreController';
import { getService } from '../di/serviceRegistration';
import { ServiceTokens } from '../di/container';
import { IAvatarService } from '../interfaces/IAvatarService';
import logger from '../utils/logger';

export class ProfileController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    const user = await UserService.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Transform user for API response
    const transformedUser = UserTransformService.transformUserForAPI(user);
    if (!transformedUser) {
      throw new Error('Failed to transform user data');
    }
    
    res.json(transformedUser);
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;
    const updateData: UpdateProfileRequest = req.body;

    // Validate input
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No update data provided'
        }
      });
    }

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format'
          }
        });
      }

      // Check if email is already taken by another user
      const emailTaken = await UserService.isEmailTaken(updateData.email, userId);
      if (emailTaken) {
        return res.status(409).json({
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Email is already in use by another account'
          }
        });
      }
    }

    // Validate username if provided
    if (updateData.username) {
      if (updateData.username.length < 3 || updateData.username.length > 30) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Username must be between 3 and 30 characters'
          }
        });
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(updateData.username)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Username can only contain letters, numbers, and underscores'
          }
        });
      }

      // Check if username is already taken by another user
      const usernameTaken = await UserService.isUsernameTaken(updateData.username, userId);
      if (usernameTaken) {
        return res.status(409).json({
          error: {
            code: 'USERNAME_TAKEN',
            message: 'Username is already taken'
          }
        });
      }
    }

    // Validate names if provided
    if (updateData.first_name && updateData.first_name.length > 50) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'First name must be 50 characters or less'
        }
      });
    }

    if (updateData.last_name && updateData.last_name.length > 50) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Last name must be 50 characters or less'
        }
      });
    }

    // Update the user profile
    const updatedUser = await UserService.updateProfile(userId, updateData);
    
    // Transform user for API response
    const transformedUser = UserTransformService.transformUserForAPI(updatedUser);
    if (!transformedUser) {
      throw new Error('Failed to transform user data');
    }

    const response: ProfileUpdateResponse = {
      user: transformedUser,
      message: 'Profile updated successfully'
    };

    res.json(response);
  }

  static async getEchoScore(req: AuthenticatedRequest, res: Response) {
    const user = await UserService.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Transform user to echo score response
    const echoScoreResponse = EchoScoreTransformService.transformUserToEchoScore(user);
    
    if (!echoScoreResponse) {
      return res.status(500).json({
        error: {
          code: 'TRANSFORM_ERROR',
          message: 'Failed to transform echo score data'
        }
      });
    }
    
    res.json(echoScoreResponse);
  }

  // Proxy to EchoScoreController.getHistory for iOS compatibility
  static getEchoScoreHistory = EchoScoreController.getHistory;

  static async getProfileStats(req: AuthenticatedRequest, res: Response) {
    const user = await UserService.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const stats = await UserService.getUserStats(req.user!.id);
    
    res.json({
      currentStreak: user.current_streak || 0,
      echoScore: user.echo_score || 0,
      totalChallengesCompleted: stats.totalChallengesCompleted,
      averageAccuracy: stats.averageAccuracy,
      totalTimeSpent: stats.totalTimeSpent,
      memberSince: user.created_at,
      lastActivity: user.last_activity_date
    });
  }

  static async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded'
          }
        });
      }

      // Get avatar service from DI container
      const avatarService = getService<IAvatarService>(ServiceTokens.AvatarService);

      // Upload and process avatar
      const avatarUrl = await avatarService.uploadUserAvatar(
        req.user!.id,
        req.file
      );

      // Get updated user
      const user = await UserService.findById(req.user!.id);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Transform and return updated user
      const transformedUser = UserTransformService.transformUserForAPI(user);
      
      res.json({
        user: transformedUser,
        message: 'Avatar uploaded successfully',
        avatarUrl
      });
    } catch (error) {
      // Handle validation errors
      if (error.message.includes('File size') || 
          error.message.includes('Invalid file type') ||
          error.message.includes('Image must')) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      }

      // Log server errors
      logger.error('Avatar upload error:', error);
      
      res.status(500).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload avatar'
        }
      });
    }
  }

  static async deleteAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      // Get avatar service from DI container
      const avatarService = getService<IAvatarService>(ServiceTokens.AvatarService);

      // Delete avatar
      await avatarService.deleteUserAvatar(req.user!.id);

      // Get updated user
      const user = await UserService.findById(req.user!.id);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Transform and return updated user
      const transformedUser = UserTransformService.transformUserForAPI(user);
      
      res.json({
        user: transformedUser,
        message: 'Avatar deleted successfully'
      });
    } catch (error) {
      logger.error('Avatar deletion error:', error);
      
      res.status(500).json({
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete avatar'
        }
      });
    }
  }
}

// Export backward compatible functions for existing routes
export const getProfile = ProfileController.getProfile;
export const getEchoScore = ProfileController.getEchoScore;