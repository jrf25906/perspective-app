import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/UserService';
import { UpdateProfileRequest, ProfileUpdateResponse } from '../models/User';

export class ProfileController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const user = await UserService.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Remove sensitive data
      const { password_hash: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user profile'
        }
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const userId = req.user.id;
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
      
      // Remove sensitive data
      const { password_hash: _, ...userWithoutPassword } = updatedUser;

      const response: ProfileUpdateResponse = {
        user: userWithoutPassword,
        message: 'Profile updated successfully'
      };

      res.json(response);

    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user profile'
        }
      });
    }
  }

  static async getEchoScore(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const user = await UserService.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        echoScore: user.echo_score || 0,
        lastUpdated: user.updated_at,
        biasProfile: user.bias_profile
      });

    } catch (error) {
      console.error('Get echo score error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get echo score'
        }
      });
    }
  }

  static async getProfileStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const user = await UserService.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      const stats = await UserService.getUserStats(req.user.id);
      
      res.json({
        currentStreak: user.current_streak || 0,
        echoScore: user.echo_score || 0,
        totalChallengesCompleted: stats.totalChallengesCompleted,
        averageAccuracy: stats.averageAccuracy,
        totalTimeSpent: stats.totalTimeSpent,
        memberSince: user.created_at,
        lastActivity: user.last_activity_date
      });

    } catch (error) {
      console.error('Get profile stats error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get profile statistics'
        }
      });
    }
  }

  static async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No avatar file uploaded'
          }
        });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

      const updatedUser = await UserService.updateProfile(req.user.id, { avatar_url: fileUrl });

      const { password_hash: _, ...userWithoutPassword } = updatedUser;

      res.json({
        user: userWithoutPassword,
        message: 'Avatar uploaded successfully'
      });

    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload avatar'
        }
      });
    }
  }
}

// Export backward compatible functions for existing routes
export const getProfile = ProfileController.getProfile;
export const getEchoScore = ProfileController.getEchoScore;