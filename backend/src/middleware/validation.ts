import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Joi schema
 */
export function validate(schema: {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}, options?: {
  stripUnknown?: boolean;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Default to NOT stripping unknown fields to allow transformation
      const validationOptions = {
        abortEarly: false,
        stripUnknown: options?.stripUnknown ?? false // Changed default to false
      };
      
      // Validate each part of the request if schema is provided
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, validationOptions);
        
        if (error) {
          logger.warn(`Validation error in body: ${error.message}`);
          return res.status(400).json({
            error: 'Validation Error',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          });
        }
        
        req.body = value;
      }
      
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, validationOptions);
        
        if (error) {
          logger.warn(`Validation error in query: ${error.message}`);
          return res.status(400).json({
            error: 'Validation Error',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          });
        }
        
        req.query = value;
      }
      
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, validationOptions);
        
        if (error) {
          logger.warn(`Validation error in params: ${error.message}`);
          return res.status(400).json({
            error: 'Validation Error',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          });
        }
        
        req.params = value;
      }
      
      next();
    } catch (err) {
      logger.error('Validation middleware error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during validation'
      });
    }
  };
}

// Common validation schemas
export const commonSchemas = {
  // ID parameter validation
  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  
  // Pagination query validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),
  
  // Date range query validation
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

// Challenge-specific validation schemas
export const challengeSchemas = {
  submitChallenge: Joi.object({
    answer: Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.array(),
      Joi.object()
    ).required(),
    timeSpentSeconds: Joi.number().integer().min(0).required()
  }),
  
  getChallenges: Joi.object({
    type: Joi.string().optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    isActive: Joi.boolean().optional()
  })
};

// User validation schemas
export const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    email: Joi.string().email().optional(),
    bias_profile: Joi.object({
      political_lean: Joi.number().min(-5).max(5).optional(),
      trusted_sources: Joi.array().items(Joi.string()).optional()
    }).optional()
  }),
  
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
    name: Joi.string().min(1).max(100).required()
  })
}; 