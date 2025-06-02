import Joi from 'joi';
import { BaseSchemas } from './BaseSchemas';
import { CustomValidationRules } from '../rules/CustomValidationRules';

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
    theme?: 'light' | 'dark' | 'auto';
    accessibility?: AccessibilitySettings;
  }

  export interface NotificationPreferences {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    dailyDigest?: boolean;
    weeklyReport?: boolean;
    challengeReminders?: boolean;
    socialUpdates?: boolean;
    marketingEmails?: boolean;
  }

  export interface PrivacySettings {
    profileVisibility?: 'public' | 'private' | 'friends';
    showEmail?: boolean;
    showStats?: boolean;
    showActivity?: boolean;
    allowFriendRequests?: boolean;
    allowMessages?: boolean;
  }

  export interface AccessibilitySettings {
    highContrast?: boolean;
    largeText?: boolean;
    reducedMotion?: boolean;
    screenReaderMode?: boolean;
  }

  export const updateProfile = Joi.object<UpdateProfileBody>({
    email: CustomValidationRules.emailWithDomainRules({
      allowDisposable: false
    }).optional(),
    username: BaseSchemas.username.optional(),
    firstName: BaseSchemas.shortString
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional(),
    lastName: BaseSchemas.shortString
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional(),
    bio: BaseSchemas.mediumString
      .max(500)
      .optional(),
    phoneNumber: CustomValidationRules.phoneNumber({
      defaultCountry: '1' // US default
    }).optional(),
    dateOfBirth: BaseSchemas.isoDate
      .max('now')
      .custom((value, helpers) => {
        // Must be at least 13 years old
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 13) {
          return helpers.error('dateOfBirth.tooYoung');
        }
        return value;
      })
      .messages({
        'dateOfBirth.tooYoung': 'You must be at least 13 years old to use this service'
      })
      .optional(),
    preferences: Joi.object({
      language: Joi.string()
        .valid('en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ru', 'ar')
        .optional(),
      timezone: CustomValidationRules.timezone().optional(),
      theme: Joi.string()
        .valid('light', 'dark', 'auto')
        .optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        sms: Joi.boolean().optional(),
        dailyDigest: Joi.boolean().optional(),
        weeklyReport: Joi.boolean().optional(),
        challengeReminders: Joi.boolean().optional(),
        socialUpdates: Joi.boolean().optional(),
        marketingEmails: Joi.boolean().optional()
      }).optional(),
      privacy: Joi.object({
        profileVisibility: Joi.string()
          .valid('public', 'private', 'friends')
          .optional(),
        showEmail: Joi.boolean().optional(),
        showStats: Joi.boolean().optional(),
        showActivity: Joi.boolean().optional(),
        allowFriendRequests: Joi.boolean().optional(),
        allowMessages: Joi.boolean().optional()
      }).optional(),
      accessibility: Joi.object({
        highContrast: Joi.boolean().optional(),
        largeText: Joi.boolean().optional(),
        reducedMotion: Joi.boolean().optional(),
        screenReaderMode: Joi.boolean().optional()
      }).optional()
    }).optional()
  }).min(1); // At least one field must be updated

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
   * Avatar upload validation
   */
  export const avatarUpload = CustomValidationRules.fileUpload({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  });

  /**
   * Avatar metadata validation
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
    altText: BaseSchemas.shortString
      .max(100)
      .optional(),
    cropData: Joi.object({
      x: Joi.number().min(0).required(),
      y: Joi.number().min(0).required(),
      width: Joi.number().positive().max(2000).required(),
      height: Joi.number().positive().max(2000).required()
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

  /**
   * Profile completeness check
   */
  export const profileCompleteness = Joi.object({
    hasAvatar: Joi.boolean(),
    hasBio: Joi.boolean(),
    hasPhoneNumber: Joi.boolean(),
    hasDateOfBirth: Joi.boolean(),
    hasPreferences: Joi.boolean(),
    completenessScore: Joi.number().min(0).max(100)
  });

  /**
   * Export profile data request
   */
  export interface ExportProfileBody {
    format: 'json' | 'csv' | 'pdf';
    includeData: string[];
  }

  export const exportProfile = Joi.object<ExportProfileBody>({
    format: Joi.string()
      .valid('json', 'csv', 'pdf')
      .required(),
    includeData: Joi.array()
      .items(Joi.string().valid(
        'profile',
        'preferences',
        'challenges',
        'activity',
        'connections',
        'messages'
      ))
      .min(1)
      .unique()
      .required()
  });

  /**
   * Privacy settings update
   */
  export const updatePrivacySettings = Joi.object<PrivacySettings>({
    profileVisibility: Joi.string()
      .valid('public', 'private', 'friends')
      .optional(),
    showEmail: Joi.boolean().optional(),
    showStats: Joi.boolean().optional(),
    showActivity: Joi.boolean().optional(),
    allowFriendRequests: Joi.boolean().optional(),
    allowMessages: Joi.boolean().optional()
  }).min(1);

  /**
   * Notification preferences update
   */
  export const updateNotifications = Joi.object<NotificationPreferences>({
    email: Joi.boolean().optional(),
    push: Joi.boolean().optional(),
    sms: Joi.boolean().optional(),
    dailyDigest: Joi.boolean().optional(),
    weeklyReport: Joi.boolean().optional(),
    challengeReminders: Joi.boolean().optional(),
    socialUpdates: Joi.boolean().optional(),
    marketingEmails: Joi.boolean().optional()
  }).min(1);
} 