import Joi from 'joi';
import { BaseSchemas } from './BaseSchemas';

/**
 * Profile validation schemas
 * Handles user profile and related data validation
 */
export namespace ProfileValidation {
  /**
   * Update profile request body
   */
  export interface UpdateProfileBody {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    preferences?: UserPreferences;
  }

  export interface UserPreferences {
    language?: string;
    timezone?: string;
    notifications?: NotificationPreferences;
    privacy?: PrivacySettings;
  }

  export interface NotificationPreferences {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    dailyDigest?: boolean;
    weeklyReport?: boolean;
  }

  export interface PrivacySettings {
    profileVisibility?: 'public' | 'private' | 'friends';
    showEmail?: boolean;
    showStats?: boolean;
  }

  export const updateProfile = Joi.object<UpdateProfileBody>({
    email: BaseSchemas.email.optional(),
    username: BaseSchemas.username.optional(),
    firstName: BaseSchemas.shortString
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional(),
    lastName: BaseSchemas.shortString
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional(),
    bio: BaseSchemas.mediumString.optional(),
    phoneNumber: BaseSchemas.phoneNumber.optional(),
    dateOfBirth: BaseSchemas.isoDate
      .max('now')
      .optional(),
    preferences: Joi.object({
      language: Joi.string()
        .valid('en', 'es', 'fr', 'de', 'pt', 'zh', 'ja')
        .optional(),
      timezone: Joi.string()
        .pattern(/^[A-Za-z]+\/[A-Za-z_]+$/)
        .optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        sms: Joi.boolean().optional(),
        dailyDigest: Joi.boolean().optional(),
        weeklyReport: Joi.boolean().optional()
      }).optional(),
      privacy: Joi.object({
        profileVisibility: Joi.string()
          .valid('public', 'private', 'friends')
          .optional(),
        showEmail: Joi.boolean().optional(),
        showStats: Joi.boolean().optional()
      }).optional()
    }).optional()
  });

  /**
   * Echo score history query parameters
   */
  export interface EchoScoreHistoryQuery {
    days?: number;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }

  export const echoScoreHistory = Joi.object<EchoScoreHistoryQuery>({
    days: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .optional(),
    startDate: BaseSchemas.isoDate.optional(),
    endDate: BaseSchemas.isoDate
      .when('startDate', {
        is: Joi.exist(),
        then: Joi.date().min(Joi.ref('startDate'))
      })
      .optional(),
    groupBy: Joi.string()
      .valid('day', 'week', 'month')
      .default('day')
  }).xor('days', 'startDate'); // Either days or date range, not both

  /**
   * Profile stats query parameters
   */
  export interface ProfileStatsQuery {
    period?: 'week' | 'month' | 'year' | 'all';
    includeDetails?: boolean;
  }

  export const profileStats = Joi.object<ProfileStatsQuery>({
    period: Joi.string()
      .valid('week', 'month', 'year', 'all')
      .default('month'),
    includeDetails: Joi.boolean().default(false)
  });

  /**
   * Avatar upload validation (handled by multer, but we can validate metadata)
   */
  export interface AvatarMetadata {
    altText?: string;
    cropData?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  export const avatarMetadata = Joi.object<AvatarMetadata>({
    altText: BaseSchemas.shortString.optional(),
    cropData: Joi.object({
      x: Joi.number().min(0).required(),
      y: Joi.number().min(0).required(),
      width: Joi.number().positive().required(),
      height: Joi.number().positive().required()
    }).optional()
  });

  /**
   * Account deletion request
   */
  export interface DeleteAccountBody {
    password: string;
    reason?: string;
    feedback?: string;
  }

  export const deleteAccount = Joi.object<DeleteAccountBody>({
    password: Joi.string().required(),
    reason: Joi.string()
      .valid('no_longer_needed', 'privacy_concerns', 'too_many_emails', 'other')
      .optional(),
    feedback: BaseSchemas.mediumString.optional()
  });
} 