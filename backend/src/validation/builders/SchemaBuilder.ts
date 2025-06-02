import Joi from 'joi';
import { LoggerFactory, LogContext } from '../../utils/logger';

const logger = LoggerFactory.create(LogContext.VALIDATION, 'SchemaBuilder');

/**
 * Schema Builder Utility
 * Provides methods to transform and compose validation schemas
 * Following Open/Closed Principle - open for extension, closed for modification
 */
export class SchemaBuilder {
  /**
   * Transform a schema for creation operations
   * Makes all defined fields required unless explicitly optional
   */
  static forCreate<T>(schema: Joi.ObjectSchema<T>): Joi.ObjectSchema<T> {
    const description = schema.describe();
    const keys = Object.keys(description.keys || {});
    
    // Fork the schema and make fields required
    const requiredFields = keys.filter(key => {
      const field = (description.keys as any)[key];
      // Don't make fields required if they have default values or are already required
      return !field.flags?.default && !field.flags?.presence;
    });
    
    if (requiredFields.length === 0) {
      return schema;
    }
    
    logger.debug('Making fields required for create operation', { fields: requiredFields });
    return schema.fork(requiredFields, (field) => field.required());
  }

  /**
   * Transform a schema for update operations
   * Makes all fields optional but validates them if provided
   */
  static forUpdate<T>(schema: Joi.ObjectSchema<T>): Joi.ObjectSchema<Partial<T>> {
    const description = schema.describe();
    const keys = Object.keys(description.keys || {});
    
    logger.debug('Making fields optional for update operation', { fields: keys });
    return schema.fork(keys, (field) => field.optional()) as Joi.ObjectSchema<Partial<T>>;
  }

  /**
   * Transform a schema for patch operations
   * Makes all fields optional but requires at least one field
   */
  static forPatch<T>(schema: Joi.ObjectSchema<T>): Joi.ObjectSchema<Partial<T>> {
    const updateSchema = SchemaBuilder.forUpdate(schema);
    return updateSchema.min(1).messages({
      'object.min': 'At least one field must be provided for update'
    });
  }

  /**
   * Add authentication context validation
   * Ensures the request has an authenticated user
   */
  static withAuth<T>(schema: Joi.Schema<T>): Joi.Schema<T> {
    return schema.custom((value, helpers) => {
      const req = helpers.prefs.context?.req;
      if (!req?.user) {
        return helpers.error('auth.required');
      }
      return value;
    }).messages({
      'auth.required': 'Authentication is required for this operation'
    });
  }

  /**
   * Add authorization validation for specific roles
   */
  static withRole<T>(schema: Joi.Schema<T>, allowedRoles: string[]): Joi.Schema<T> {
    return schema.custom((value, helpers) => {
      const req = helpers.prefs.context?.req;
      const userRole = req?.user?.role;
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        return helpers.error('auth.forbidden');
      }
      
      return value;
    }).messages({
      'auth.forbidden': `Requires one of the following roles: ${allowedRoles.join(', ')}`
    });
  }

  /**
   * Add conditional validation based on another field
   */
  static when<T>(
    schema: Joi.Schema<T>,
    field: string,
    conditions: {
      is?: any;
      not?: any;
      then: (schema: Joi.Schema<T>) => Joi.Schema<T>;
      otherwise?: (schema: Joi.Schema<T>) => Joi.Schema<T>;
    }
  ): Joi.Schema<T> {
    const whenOptions: any = {};
    
    if (conditions.is !== undefined) {
      whenOptions.is = conditions.is;
    }
    if (conditions.not !== undefined) {
      whenOptions.not = conditions.not;
    }
    
    whenOptions.then = conditions.then(Joi.any() as Joi.Schema<T>);
    
    if (conditions.otherwise) {
      whenOptions.otherwise = conditions.otherwise(Joi.any() as Joi.Schema<T>);
    }
    
    return schema.when(field, whenOptions);
  }

  /**
   * Add custom transformation to the schema
   */
  static withTransform<T, R>(
    schema: Joi.Schema<T>,
    transformer: (value: T) => R
  ): Joi.Schema<R> {
    return schema.custom((value, helpers) => {
      try {
        const transformed = transformer(value);
        return transformed;
      } catch (error) {
        logger.error('Schema transformation failed', error as Error);
        return helpers.error('transform.failed');
      }
    }).messages({
      'transform.failed': 'Failed to transform the provided value'
    }) as unknown as Joi.Schema<R>;
  }

  /**
   * Add async validation (e.g., database checks)
   */
  static withAsyncValidation<T>(
    schema: Joi.Schema<T>,
    validator: (value: T) => Promise<boolean>,
    errorMessage: string
  ): Joi.Schema<T> {
    return schema.external(async (value, helpers) => {
      try {
        const isValid = await validator(value);
        if (!isValid) {
          return helpers.error('custom.async');
        }
        return value;
      } catch (error) {
        logger.error('Async validation failed', error as Error);
        return helpers.error('custom.async.error');
      }
    }).messages({
      'custom.async': errorMessage,
      'custom.async.error': 'Validation failed due to an error'
    });
  }

  /**
   * Strip sensitive fields from the schema
   */
  static stripSensitive<T>(
    schema: Joi.ObjectSchema<T>,
    sensitiveFields: string[]
  ): Joi.ObjectSchema<T> {
    return schema.fork(sensitiveFields, (field) => field.strip());
  }

  /**
   * Add default values based on context
   */
  static withContextualDefaults<T>(
    schema: Joi.Schema<T>,
    defaultProvider: (context: any) => Partial<T>
  ): Joi.Schema<T> {
    return schema.custom((value, helpers) => {
      const defaults = defaultProvider(helpers.prefs.context);
      return { ...defaults, ...value };
    });
  }

  /**
   * Create a schema that validates array items individually
   */
  static forArrayItems<T>(
    itemSchema: Joi.Schema<T>,
    arrayOptions?: {
      min?: number;
      max?: number;
      unique?: boolean | ((a: T, b: T) => boolean);
    }
  ): Joi.ArraySchema<T[]> {
    let arraySchema = Joi.array<T[]>().items(itemSchema);
    
    if (arrayOptions?.min !== undefined) {
      arraySchema = arraySchema.min(arrayOptions.min);
    }
    if (arrayOptions?.max !== undefined) {
      arraySchema = arraySchema.max(arrayOptions.max);
    }
    if (arrayOptions?.unique !== undefined) {
      arraySchema = arraySchema.unique(arrayOptions.unique as any);
    }
    
    return arraySchema;
  }

  /**
   * Merge multiple schemas with conflict resolution
   */
  static merge<T>(
    schemas: Joi.ObjectSchema<any>[],
    conflictResolver?: (key: string, schemas: Joi.ObjectSchema<any>[]) => Joi.Schema<any>
  ): Joi.ObjectSchema<T> {
    if (schemas.length === 0) {
      return Joi.object<T>();
    }
    
    if (schemas.length === 1) {
      return schemas[0] as Joi.ObjectSchema<T>;
    }
    
    // Use Joi's concat method for merging
    let merged = schemas[0];
    for (let i = 1; i < schemas.length; i++) {
      merged = merged.concat(schemas[i]) as Joi.ObjectSchema<any>;
    }
    
    return merged as Joi.ObjectSchema<T>;
  }

  /**
   * Add timestamps to schema
   */
  static withTimestamps<T>(schema: Joi.ObjectSchema<T>): Joi.ObjectSchema<T & { createdAt?: Date; updatedAt?: Date }> {
    // Create a new schema that extends the original
    const timestampSchema = Joi.object({
      createdAt: Joi.date().default(() => new Date()),
      updatedAt: Joi.date().default(() => new Date())
    });
    
    // Use concat to merge schemas
    return schema.concat(timestampSchema) as Joi.ObjectSchema<T & { createdAt?: Date; updatedAt?: Date }>;
  }
}

/**
 * Common schema transformations as utility functions
 */
export const SchemaTransforms = {
  /**
   * Trim all string fields
   */
  trimStrings: <T>(schema: Joi.ObjectSchema<T>): Joi.ObjectSchema<T> => {
    const description = schema.describe();
    const stringKeys = Object.entries(description.keys || {})
      .filter(([_, value]) => (value as any).type === 'string')
      .map(([key, _]) => key);
    
    if (stringKeys.length === 0) {
      return schema;
    }
    
    return schema.fork(stringKeys, (field) => {
      // Type guard to ensure we're working with string schema
      if ('trim' in field && typeof field.trim === 'function') {
        return (field as Joi.StringSchema).trim();
      }
      return field;
    });
  },

  /**
   * Normalize email fields
   */
  normalizeEmails: <T>(schema: Joi.ObjectSchema<T>): Joi.ObjectSchema<T> => {
    const description = schema.describe();
    const emailKeys = Object.entries(description.keys || {})
      .filter(([_, value]) => {
        const rules = (value as any).rules || [];
        return rules.some((rule: any) => rule.name === 'email');
      })
      .map(([key, _]) => key);
    
    if (emailKeys.length === 0) {
      return schema;
    }
    
    return schema.fork(emailKeys, (field) => {
      // Type guard to ensure we're working with string schema
      if ('lowercase' in field && typeof field.lowercase === 'function' &&
          'trim' in field && typeof field.trim === 'function') {
        return (field as Joi.StringSchema).lowercase().trim();
      }
      return field;
    });
  },

  /**
   * Add timestamps to schema
   */
  withTimestamps: <T>(schema: Joi.ObjectSchema<T>): Joi.ObjectSchema<T & { createdAt?: Date; updatedAt?: Date }> => {
    // Create a new schema that extends the original
    const timestampSchema = Joi.object({
      createdAt: Joi.date().default(() => new Date()),
      updatedAt: Joi.date().default(() => new Date())
    });
    
    // Use concat to merge schemas
    return schema.concat(timestampSchema) as Joi.ObjectSchema<T & { createdAt?: Date; updatedAt?: Date }>;
  }
}; 