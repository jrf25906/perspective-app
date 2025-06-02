import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { 
  ValidationSchema, 
  ValidationOptions, 
  ValidationError,
  ValidatedRequest 
} from './types';
import logger from '../../utils/logger';

/**
 * Enhanced Validation Middleware
 * Implements SOLID principles with clear separation of concerns
 */
export class ValidationMiddleware {
  private static readonly DEFAULT_OPTIONS: ValidationOptions = {
    stripUnknown: false,
    abortEarly: false,
    allowUnknown: false
  };

  /**
   * Create validation middleware for request validation
   * @param schema Validation schema for different request parts
   * @param options Validation options
   */
  static validate<TBody = any, TQuery = any, TParams = any>(
    schema: ValidationSchema<TBody, TQuery, TParams>,
    options?: ValidationOptions
  ) {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const validatedReq = req as ValidatedRequest<TBody, TQuery, TParams>;
        validatedReq.validatedData = {};

        // Validate each request part
        if (schema.body) {
          const result = await this.validatePart(
            'body',
            req.body,
            schema.body,
            mergedOptions
          );
          if (!result.success) {
            return this.sendValidationError(res, result.errors!);
          }
          req.body = result.data;
          validatedReq.validatedData.body = result.data;
        }

        if (schema.query) {
          const result = await this.validatePart(
            'query',
            req.query,
            schema.query,
            mergedOptions
          );
          if (!result.success) {
            return this.sendValidationError(res, result.errors!);
          }
          req.query = result.data as any; // Cast needed for Express query type
          validatedReq.validatedData.query = result.data;
        }

        if (schema.params) {
          const result = await this.validatePart(
            'params',
            req.params,
            schema.params,
            mergedOptions
          );
          if (!result.success) {
            return this.sendValidationError(res, result.errors!);
          }
          req.params = result.data as any; // Cast needed for Express params type
          validatedReq.validatedData.params = result.data;
        }

        if (schema.headers) {
          const result = await this.validatePart(
            'headers',
            req.headers,
            schema.headers,
            mergedOptions
          );
          if (!result.success) {
            return this.sendValidationError(res, result.errors!);
          }
          // Don't modify headers, just validate
        }

        next();
      } catch (error) {
        logger.error('Validation middleware error:', error);
        res.status(500).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'An error occurred during validation'
          }
        });
      }
    };
  }

  /**
   * Validate a specific part of the request
   */
  private static async validatePart<T>(
    part: string,
    data: any,
    schema: Joi.Schema<T>,
    options: ValidationOptions
  ): Promise<{ success: boolean; data?: T; errors?: ValidationError[] }> {
    try {
      const joiOptions: Joi.ValidationOptions = {
        abortEarly: options.abortEarly,
        stripUnknown: options.stripUnknown,
        allowUnknown: options.allowUnknown,
        context: options.context
      };

      const value = await schema.validateAsync(data, joiOptions);
      return { success: true, data: value };
    } catch (error) {
      if (Joi.isError(error)) {
        const errors = this.transformJoiErrors(error, part);
        logger.warn(`Validation failed for ${part}:`, errors);
        return { success: false, errors };
      }
      throw error;
    }
  }

  /**
   * Transform Joi errors to standardized format
   */
  private static transformJoiErrors(
    joiError: Joi.ValidationError,
    part: string
  ): ValidationError[] {
    return joiError.details.map(detail => ({
      field: `${part}.${detail.path.join('.')}`,
      message: detail.message,
      code: this.getErrorCode(detail.type),
      type: detail.type,
      context: detail.context
    }));
  }

  /**
   * Map Joi error types to application error codes
   */
  private static getErrorCode(joiType: string): string {
    const errorCodeMap: Record<string, string> = {
      'any.required': 'FIELD_REQUIRED',
      'string.empty': 'FIELD_EMPTY',
      'string.email': 'INVALID_EMAIL',
      'string.min': 'STRING_TOO_SHORT',
      'string.max': 'STRING_TOO_LONG',
      'number.min': 'NUMBER_TOO_SMALL',
      'number.max': 'NUMBER_TOO_LARGE',
      'number.integer': 'MUST_BE_INTEGER',
      'array.min': 'ARRAY_TOO_SHORT',
      'array.max': 'ARRAY_TOO_LONG',
      'object.unknown': 'UNKNOWN_FIELD',
      'any.invalid': 'INVALID_VALUE',
      'date.base': 'INVALID_DATE'
    };

    return errorCodeMap[joiType] || 'VALIDATION_ERROR';
  }

  /**
   * Send standardized validation error response
   */
  private static sendValidationError(
    res: Response,
    errors: ValidationError[]
  ): void {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        validationErrors: errors
      }
    });
  }

  /**
   * Create a validation middleware that only runs if condition is met
   */
  static validateIf<TBody = any, TQuery = any, TParams = any>(
    condition: (req: Request) => boolean,
    schema: ValidationSchema<TBody, TQuery, TParams>,
    options?: ValidationOptions
  ) {
    const validator = this.validate(schema, options);
    
    return (req: Request, res: Response, next: NextFunction) => {
      if (condition(req)) {
        return validator(req, res, next);
      }
      next();
    };
  }

  /**
   * Combine multiple validation schemas
   */
  static combine<TBody = any, TQuery = any, TParams = any>(
    ...schemas: ValidationSchema<any, any, any>[]
  ): ValidationSchema<TBody, TQuery, TParams> {
    const combined: ValidationSchema<TBody, TQuery, TParams> = {};

    for (const schema of schemas) {
      if (schema.body) {
        combined.body = combined.body 
          ? (combined.body as any).concat(schema.body)
          : schema.body;
      }
      if (schema.query) {
        combined.query = combined.query
          ? (combined.query as any).concat(schema.query)
          : schema.query;
      }
      if (schema.params) {
        combined.params = combined.params
          ? (combined.params as any).concat(schema.params)
          : schema.params;
      }
      if (schema.headers) {
        combined.headers = combined.headers
          ? (combined.headers as any).concat(schema.headers)
          : schema.headers;
      }
    }

    return combined;
  }
} 