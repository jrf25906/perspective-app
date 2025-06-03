import { Request, Response } from 'express';
import logger from '../utils/logger';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';
import { CreateUserRequest, LoginRequest, User } from '../models/User';
import { UserService } from '../services/UserService';
import { UserTransformService } from '../services/UserTransformService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

      // Transform user for API response
      const transformedUser = UserTransformService.transformUserForAPI(newUser);
      if (!transformedUser) {
        throw new Error('Failed to transform user data');
      }

      res.status(201).json({
        user: transformedUser,
        token
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user'
        }
      });
    }
  }

  static async googleSignIn(req: Request, res: Response) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Google ID token is required'
          }
        });
      }

      // Verify the Google ID token
      let ticket;
      try {
        ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
      } catch (error) {
        logger.error('Google token verification failed:', error);
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid Google ID token'
          }
        });
      }

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token payload'
          }
        });
      }

      const { email, name, given_name, family_name, picture } = payload;

      // Check if user exists
      let user = await UserService.findByEmail(email);

      if (!user) {
        // Create new user with Google info
        const username = email.split('@')[0]; // Use email prefix as username
        
        // Check if username already exists and make it unique if needed
        let finalUsername = username;
        let counter = 1;
        while (await UserService.findByUsername(finalUsername)) {
          finalUsername = `${username}${counter}`;
          counter++;
        }

        user = await UserService.create({
          email,
          username: finalUsername,
          password_hash: null, // Null for Google users instead of empty string
          first_name: given_name || name?.split(' ')[0] || null,
          last_name: family_name || name?.split(' ').slice(1).join(' ') || null,
          google_id: payload.sub,
          avatar_url: picture || null,
          email_verified: payload.email_verified || false
        });
      } else {
        // Update existing user with Google info if not already set
        if (!user.google_id) {
          await UserService.updateGoogleInfo(user.id, {
            google_id: payload.sub,
            avatar_url: picture || user.avatar_url,
            email_verified: payload.email_verified || user.email_verified
          });
        }
        
        // Update last activity
        await UserService.updateLastActivity(user.id);
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username
      });

      // Transform user for API response
      const transformedUser = UserTransformService.transformUserForAPI(user);
      if (!transformedUser) {
        throw new Error('Failed to transform user data');
      }

      res.json({
        user: transformedUser,
        token
      });

    } catch (error) {
      logger.error('Google sign-in error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to authenticate with Google'
        }
      });
    }
  }

  static async login(req: Request, res: Response) {
    const correlationId = (req as any).correlationId || 'unknown';
    const startTime = Date.now();
    
    try {
      const { email, password }: LoginRequest = req.body;

      logger.info('Login attempt started', {
        correlationId,
        email: email ? email.replace(/^(.{3}).*@/, '$1***@') : 'not provided', // Mask email
        timestamp: new Date().toISOString()
      });

      // Validate input
      if (!email || !password) {
        logger.warn('Login validation failed: missing credentials', {
          correlationId,
          hasEmail: !!email,
          hasPassword: !!password
        });
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required'
          }
        });
      }

      // Find user
      logger.debug('Looking up user by email', { correlationId, email: email.replace(/^(.{3}).*@/, '$1***@') });
      const user = await UserService.findByEmail(email);
      
      if (!user) {
        logger.warn('Login failed: user not found', {
          correlationId,
          email: email.replace(/^(.{3}).*@/, '$1***@'),
          duration: Date.now() - startTime
        });
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      logger.debug('User found, checking authentication method', {
        correlationId,
        userId: user.id,
        hasPasswordHash: !!user.password_hash,
        hasGoogleId: !!user.google_id
      });

      // Check if user has a password (not a Google-only user)
      if (!user.password_hash) {
        logger.warn('Login failed: user has no password (Google-only account)', {
          correlationId,
          userId: user.id,
          duration: Date.now() - startTime
        });
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Verify password
      logger.debug('Verifying password', { correlationId, userId: user.id });
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        logger.warn('Login failed: invalid password', {
          correlationId,
          userId: user.id,
          duration: Date.now() - startTime
        });
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      logger.debug('Password verified, updating last activity', { correlationId, userId: user.id });
      
      // Update last activity
      await UserService.updateLastActivity(user.id);

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username
      });

      logger.debug('Token generated, transforming user data', { correlationId, userId: user.id });

      // Transform user for API response
      const transformedUser = UserTransformService.transformUserForAPI(user);
      if (!transformedUser) {
        logger.error('Failed to transform user data', {
          correlationId,
          userId: user.id,
          user: JSON.stringify(user)
        });
        throw new Error('Failed to transform user data');
      }

      logger.info('Login successful', {
        correlationId,
        userId: user.id,
        username: user.username,
        duration: Date.now() - startTime
      });

      res.json({
        user: transformedUser,
        token
      });

    } catch (error) {
      logger.error('Login error', {
        correlationId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        duration: Date.now() - startTime
      });
      
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

      // Transform user for API response
      const transformedUser = UserTransformService.transformUserForAPI(user);
      if (!transformedUser) {
        throw new Error('Failed to transform user data');
      }

      res.json(transformedUser);

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user profile'
        }
      });
    }
  }
} 