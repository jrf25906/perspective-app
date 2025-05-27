import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';
import { CreateUserRequest, LoginRequest, User } from '../models/User';
import { UserService } from '../services/UserService';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, username, password, first_name, last_name }: CreateUserRequest = req.body;

      // Validate input
      if (!email || !username || !password) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, username, and password are required'
          }
        });
      }

      // Check if user already exists
      const existingUser = await UserService.findByEmailOrUsername(email, username);
      if (existingUser) {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email or username already exists'
          }
        });
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await UserService.create({
        email,
        username,
        password_hash,
        first_name,
        last_name
      });

      // Generate token
      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      });

      // Return user without password
      const { password_hash: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user'
        }
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required'
          }
        });
      }

      // Find user
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Update last activity
      await UserService.updateLastActivity(user.id);

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username
      });

      // Return user without password
      const { password_hash: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to authenticate user'
        }
      });
    }
  }

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
} 