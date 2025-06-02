import Joi from 'joi';
import { BaseSchemas } from './BaseSchemas';

/**
 * Authentication validation schemas
 * Implements strict validation for auth-related endpoints
 */
export namespace AuthValidation {
  /**
   * User registration request body
   */
  export interface RegisterBody {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }

  export const register = Joi.object<RegisterBody>({
    email: BaseSchemas.email.required(),
    username: BaseSchemas.username.required(),
    password: BaseSchemas.password
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'string.min': 'Password must be at least 8 characters long'
      }),
    firstName: BaseSchemas.shortString
      .pattern(/^[a-zA-Z\s'-]+$/)
      .messages({
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
      })
      .optional(),
    lastName: BaseSchemas.shortString
      .pattern(/^[a-zA-Z\s'-]+$/)
      .messages({
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
      })
      .optional()
  }).messages({
    'object.unknown': 'Unknown field: {#key}'
  });

  /**
   * User login request body
   */
  export interface LoginBody {
    email: string;
    password: string;
    rememberMe?: boolean;
  }

  export const login = Joi.object<LoginBody>({
    email: BaseSchemas.email.required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional()
  });

  /**
   * Google Sign-In request body
   */
  export interface GoogleSignInBody {
    idToken: string;
  }

  export const googleSignIn = Joi.object<GoogleSignInBody>({
    idToken: Joi.string()
      .required()
      .min(100) // Google ID tokens are typically long
      .messages({
        'string.min': 'Invalid Google ID token'
      })
  });

  /**
   * Password reset request
   */
  export interface PasswordResetRequestBody {
    email: string;
  }

  export const passwordResetRequest = Joi.object<PasswordResetRequestBody>({
    email: BaseSchemas.email.required()
  });

  /**
   * Password reset confirmation
   */
  export interface PasswordResetConfirmBody {
    token: string;
    newPassword: string;
  }

  export const passwordResetConfirm = Joi.object<PasswordResetConfirmBody>({
    token: Joi.string()
      .required()
      .length(64) // Assuming 32-byte token in hex
      .messages({
        'string.length': 'Invalid reset token'
      }),
    newPassword: BaseSchemas.password.required()
  });

  /**
   * Change password (authenticated user)
   */
  export interface ChangePasswordBody {
    currentPassword: string;
    newPassword: string;
  }

  export const changePassword = Joi.object<ChangePasswordBody>({
    currentPassword: Joi.string().required(),
    newPassword: BaseSchemas.password
      .required()
      .invalid(Joi.ref('currentPassword'))
      .messages({
        'any.invalid': 'New password must be different from current password'
      })
  });

  /**
   * Refresh token request
   */
  export interface RefreshTokenBody {
    refreshToken: string;
  }

  export const refreshToken = Joi.object<RefreshTokenBody>({
    refreshToken: Joi.string()
      .required()
      .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
      .messages({
        'string.pattern.base': 'Invalid refresh token format'
      })
  });

  /**
   * Email verification
   */
  export interface VerifyEmailBody {
    token: string;
  }

  export const verifyEmail = Joi.object<VerifyEmailBody>({
    token: Joi.string()
      .required()
      .length(64)
      .messages({
        'string.length': 'Invalid verification token'
      })
  });

  /**
   * Two-factor authentication enable
   */
  export interface Enable2FABody {
    password: string;
  }

  export const enable2FA = Joi.object<Enable2FABody>({
    password: Joi.string().required()
  });

  /**
   * Two-factor authentication verify
   */
  export interface Verify2FABody {
    code: string;
  }

  export const verify2FA = Joi.object<Verify2FABody>({
    code: Joi.string()
      .required()
      .pattern(/^\d{6}$/)
      .messages({
        'string.pattern.base': 'Code must be 6 digits'
      })
  });
} 