import Joi from 'joi';

/**
 * Base validation schemas
 * Provides reusable, composable validation building blocks
 * Following the DRY principle
 */
export namespace BaseSchemas {
  // ============= Primitive Types =============
  
  /**
   * Positive integer ID validation
   */
  export const id = Joi.number()
    .integer()
    .positive()
    .description('Unique identifier');

  /**
   * Email validation with normalization
   */
  export const email = Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(255)
    .description('Email address');

  /**
   * Username validation
   */
  export const username = Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .description('Username');

  /**
   * Strong password validation
   */
  export const password = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .description('Password with uppercase, lowercase, and number');

  /**
   * Generic string with length limits
   */
  export const shortString = Joi.string().max(50).trim();
  export const mediumString = Joi.string().max(255).trim();
  export const longString = Joi.string().max(1000).trim();

  /**
   * URL validation
   */
  export const url = Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .max(2048);

  /**
   * Phone number validation (international format)
   */
  export const phoneNumber = Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .description('International phone number');

  // ============= Date & Time =============

  /**
   * ISO date string
   */
  export const isoDate = Joi.date().iso();

  /**
   * Date range validation
   */
  export const dateRange = Joi.object({
    startDate: isoDate.required(),
    endDate: isoDate.min(Joi.ref('startDate')).required()
  });

  /**
   * Timestamp (Unix milliseconds)
   */
  export const timestamp = Joi.number()
    .integer()
    .positive()
    .max(Date.now() + 86400000); // Max 1 day in future

  // ============= Common Objects =============

  /**
   * Pagination parameters
   */
  export const pagination = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).optional()
  });

  /**
   * Sorting parameters
   */
  export const sorting = Joi.object({
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  });

  /**
   * Paginated query with sorting
   */
  export const paginatedQuery = pagination.concat(sorting);

  /**
   * Geolocation coordinates
   */
  export const coordinates = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  });

  /**
   * Address object
   */
  export const address = Joi.object({
    street: mediumString.optional(),
    city: shortString.optional(),
    state: shortString.optional(),
    country: Joi.string().length(2).uppercase().optional(),
    postalCode: Joi.string().max(20).optional()
  });

  // ============= Arrays =============

  /**
   * Array of IDs
   */
  export const idArray = Joi.array()
    .items(id)
    .unique()
    .max(100);

  /**
   * Array of strings
   */
  export const stringArray = Joi.array()
    .items(Joi.string())
    .max(100);

  /**
   * Tags array
   */
  export const tags = Joi.array()
    .items(Joi.string().alphanum().max(50))
    .unique()
    .max(20);

  // ============= Enums =============

  /**
   * Status enum
   */
  export const status = Joi.string()
    .valid('active', 'inactive', 'pending', 'archived');

  /**
   * User role enum
   */
  export const userRole = Joi.string()
    .valid('user', 'admin', 'moderator');

  /**
   * HTTP methods
   */
  export const httpMethod = Joi.string()
    .valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
    .uppercase();

  // ============= Utility Functions =============

  /**
   * Make any schema optional with null allowed
   */
  export const nullable = <T>(schema: Joi.Schema<T>) => 
    schema.optional().allow(null);

  /**
   * Make any schema required with custom error
   */
  export const required = <T>(schema: Joi.Schema<T>, fieldName: string) =>
    schema.required().messages({
      'any.required': `${fieldName} is required`
    });

  /**
   * Add custom validation message
   */
  export const withMessage = <T>(
    schema: Joi.Schema<T>, 
    type: string, 
    message: string
  ) => schema.messages({ [type]: message });

  /**
   * Conditional validation based on another field
   */
  export const when = <T>(
    schema: Joi.Schema<T>,
    field: string,
    options: {
      is: any;
      then: Joi.Schema;
      otherwise?: Joi.Schema;
    }
  ) => Joi.when(field, options);
} 