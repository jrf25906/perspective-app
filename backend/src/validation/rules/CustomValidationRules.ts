import Joi from 'joi';
import { LoggerFactory, LogContext } from '../../utils/logger';

const logger = LoggerFactory.create(LogContext.VALIDATION, 'CustomValidationRules');

/**
 * Custom validation rules for common use cases
 * Following DRY principle - reusable validation logic
 */
export class CustomValidationRules {
  /**
   * Validate password strength with entropy calculation
   */
  static strongPassword(minEntropy: number = 50): Joi.StringSchema {
    return Joi.string()
      .min(8)
      .max(128)
      .custom((value, helpers) => {
        const entropy = CustomValidationRules.calculatePasswordEntropy(value);
        
        if (entropy < minEntropy) {
          return helpers.error('password.weak');
        }
        
        // Check for common patterns
        if (CustomValidationRules.hasCommonPatterns(value)) {
          return helpers.error('password.common');
        }
        
        return value;
      })
      .messages({
        'password.weak': 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols.',
        'password.common': 'Password contains common patterns. Please choose a more unique password.'
      });
  }

  /**
   * Calculate password entropy
   */
  private static calculatePasswordEntropy(password: string): number {
    const charsets = {
      lowercase: /[a-z]/.test(password) ? 26 : 0,
      uppercase: /[A-Z]/.test(password) ? 26 : 0,
      numbers: /[0-9]/.test(password) ? 10 : 0,
      symbols: /[^a-zA-Z0-9]/.test(password) ? 32 : 0
    };
    
    const poolSize = Object.values(charsets).reduce((sum, size) => sum + size, 0);
    const entropy = password.length * Math.log2(poolSize);
    
    return entropy;
  }

  /**
   * Check for common password patterns
   */
  private static hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /^(password|admin|user|test)/i,
      /123|abc|qwerty/i,
      /(.)\1{2,}/, // Repeated characters
      /^[0-9]+$/, // Only numbers
      /^[a-z]+$/i // Only letters
    ];
    
    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Validate email with domain restrictions
   */
  static emailWithDomainRules(options?: {
    allowedDomains?: string[];
    blockedDomains?: string[];
    allowDisposable?: boolean;
  }): Joi.StringSchema {
    return Joi.string()
      .email({ tlds: { allow: true } })
      .custom((value, helpers) => {
        const domain = value.split('@')[1];
        
        // Check allowed domains
        if (options?.allowedDomains && !options.allowedDomains.includes(domain)) {
          return helpers.error('email.domain.notAllowed');
        }
        
        // Check blocked domains
        if (options?.blockedDomains && options.blockedDomains.includes(domain)) {
          return helpers.error('email.domain.blocked');
        }
        
        // Check disposable email domains
        if (!options?.allowDisposable && CustomValidationRules.isDisposableEmail(domain)) {
          return helpers.error('email.disposable');
        }
        
        return value;
      })
      .messages({
        'email.domain.notAllowed': 'Email domain is not allowed',
        'email.domain.blocked': 'Email domain is blocked',
        'email.disposable': 'Disposable email addresses are not allowed'
      });
  }

  /**
   * Check if email domain is disposable
   */
  private static isDisposableEmail(domain: string): boolean {
    // Common disposable email domains
    const disposableDomains = [
      'tempmail.com', 'throwaway.email', '10minutemail.com',
      'guerrillamail.com', 'mailinator.com', 'yopmail.com'
    ];
    
    return disposableDomains.includes(domain.toLowerCase());
  }

  /**
   * Validate timezone
   */
  static timezone(): Joi.StringSchema {
    return Joi.string()
      .custom((value, helpers) => {
        try {
          // Check if timezone is valid using Intl API
          new Intl.DateTimeFormat('en-US', { timeZone: value });
          return value;
        } catch (error) {
          return helpers.error('timezone.invalid');
        }
      })
      .messages({
        'timezone.invalid': 'Invalid timezone identifier'
      });
  }

  /**
   * Validate locale
   */
  static locale(): Joi.StringSchema {
    return Joi.string()
      .pattern(/^[a-z]{2}(-[A-Z]{2})?$/)
      .custom((value, helpers) => {
        try {
          // Validate locale format
          new Intl.Locale(value);
          return value;
        } catch (error) {
          return helpers.error('locale.invalid');
        }
      })
      .messages({
        'locale.invalid': 'Invalid locale format (e.g., en-US, fr-FR)'
      });
  }

  /**
   * Validate phone number with international format
   */
  static phoneNumber(options?: {
    defaultCountry?: string;
    allowedCountries?: string[];
  }): Joi.StringSchema {
    return Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .custom((value, helpers) => {
        // Basic E.164 validation
        const cleanNumber = value.replace(/\D/g, '');
        
        if (cleanNumber.length < 7 || cleanNumber.length > 15) {
          return helpers.error('phone.invalid');
        }
        
        // Format to E.164 if not already
        if (!value.startsWith('+')) {
          if (options?.defaultCountry) {
            // Add country code based on default
            return `+${options.defaultCountry}${cleanNumber}`;
          }
          return helpers.error('phone.countryCode');
        }
        
        return value;
      })
      .messages({
        'phone.invalid': 'Invalid phone number format',
        'phone.countryCode': 'Phone number must include country code'
      });
  }

  /**
   * Validate URL with specific requirements
   */
  static url(options?: {
    protocols?: string[];
    requireTLD?: boolean;
    allowLocalhost?: boolean;
  }): Joi.StringSchema {
    const protocols = options?.protocols || ['http', 'https'];
    
    return Joi.string()
      .uri({ scheme: protocols })
      .custom((value, helpers) => {
        try {
          const url = new URL(value);
          
          // Check localhost
          if (!options?.allowLocalhost && ['localhost', '127.0.0.1'].includes(url.hostname)) {
            return helpers.error('url.localhost');
          }
          
          // Check TLD requirement
          if (options?.requireTLD && !url.hostname.includes('.')) {
            return helpers.error('url.tld');
          }
          
          return value;
        } catch (error) {
          return helpers.error('url.invalid');
        }
      })
      .messages({
        'url.invalid': 'Invalid URL format',
        'url.localhost': 'Localhost URLs are not allowed',
        'url.tld': 'URL must include a top-level domain'
      });
  }

  /**
   * Validate file upload metadata
   */
  static fileUpload(options: {
    maxSize: number; // in bytes
    allowedMimeTypes: string[];
    allowedExtensions?: string[];
  }): Joi.ObjectSchema {
    return Joi.object({
      filename: Joi.string().required(),
      mimetype: Joi.string()
        .valid(...options.allowedMimeTypes)
        .required()
        .messages({
          'any.only': `File type must be one of: ${options.allowedMimeTypes.join(', ')}`
        }),
      size: Joi.number()
        .max(options.maxSize)
        .required()
        .messages({
          'number.max': `File size must not exceed ${options.maxSize / 1024 / 1024}MB`
        }),
      encoding: Joi.string().optional()
    }).custom((value, helpers) => {
      // Additional extension validation
      if (options.allowedExtensions) {
        const ext = value.filename.split('.').pop()?.toLowerCase();
        if (!ext || !options.allowedExtensions.includes(ext)) {
          return helpers.error('file.extension');
        }
      }
      
      return value;
    }).messages({
      'file.extension': `File extension must be one of: ${options.allowedExtensions?.join(', ')}`
    });
  }

  /**
   * Validate date range
   */
  static dateRange(options?: {
    maxDays?: number;
    allowFuture?: boolean;
    allowPast?: boolean;
  }): Joi.ObjectSchema {
    return Joi.object({
      startDate: Joi.date()
        .iso()
        .when('$allowPast', {
          is: false,
          then: Joi.date().min('now')
        })
        .when('$allowFuture', {
          is: false,
          then: Joi.date().max('now')
        })
        .required(),
      endDate: Joi.date()
        .iso()
        .min(Joi.ref('startDate'))
        .when('$allowFuture', {
          is: false,
          then: Joi.date().max('now')
        })
        .required()
    }).custom((value, helpers) => {
      if (options?.maxDays) {
        const start = new Date(value.startDate);
        const end = new Date(value.endDate);
        const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > options.maxDays) {
          return helpers.error('dateRange.tooLong');
        }
      }
      
      return value;
    }).messages({
      'dateRange.tooLong': `Date range cannot exceed ${options?.maxDays} days`
    });
  }

  /**
   * Validate JSON string
   */
  static jsonString(schema?: Joi.Schema): Joi.StringSchema {
    return Joi.string()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          
          // If schema provided, validate the parsed JSON
          if (schema) {
            const { error } = schema.validate(parsed);
            if (error) {
              return helpers.error('json.schema');
            }
          }
          
          return value;
        } catch (error) {
          return helpers.error('json.invalid');
        }
      })
      .messages({
        'json.invalid': 'Invalid JSON string',
        'json.schema': 'JSON content does not match expected schema'
      });
  }

  /**
   * Validate HTML content (sanitized)
   */
  static safeHtml(options?: {
    maxLength?: number;
    allowedTags?: string[];
  }): Joi.StringSchema {
    return Joi.string()
      .max(options?.maxLength || 10000)
      .custom((value, helpers) => {
        // Basic XSS prevention
        const dangerousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i, // Event handlers
          /<iframe/i,
          /<embed/i,
          /<object/i
        ];
        
        if (dangerousPatterns.some(pattern => pattern.test(value))) {
          return helpers.error('html.dangerous');
        }
        
        return value;
      })
      .messages({
        'html.dangerous': 'HTML content contains potentially dangerous elements'
      });
  }
}

/**
 * Convenience export for common validation patterns
 */
export const ValidationPatterns = {
  // Common regex patterns
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9-]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  
  // Common validation schemas
  uuid: () => Joi.string().pattern(ValidationPatterns.UUID).messages({
    'string.pattern.base': 'Must be a valid UUID'
  }),
  
  slug: () => Joi.string().pattern(ValidationPatterns.SLUG).messages({
    'string.pattern.base': 'Must be a valid slug (lowercase letters, numbers, and hyphens)'
  }),
  
  username: () => Joi.string().pattern(ValidationPatterns.USERNAME).messages({
    'string.pattern.base': 'Username must be 3-30 characters, containing only letters, numbers, underscores, and hyphens'
  }),
  
  hexColor: () => Joi.string().pattern(ValidationPatterns.HEX_COLOR).messages({
    'string.pattern.base': 'Must be a valid hex color (e.g., #FFFFFF)'
  })
}; 