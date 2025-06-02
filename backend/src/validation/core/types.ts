import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import Joi from 'joi';

/**
 * Type-safe validation schema interface
 * Defines the structure of validation schemas for different request parts
 */
export interface ValidationSchema<
  TBody = any,
  TQuery = any,
  TParams = any,
  THeaders = any
> {
  body?: Joi.Schema<TBody>;
  query?: Joi.Schema<TQuery>;
  params?: Joi.Schema<TParams>;
  headers?: Joi.Schema<THeaders>;
}

/**
 * Validated request interface
 * Extends Express Request with strongly typed validated data
 */
export interface ValidatedRequest<
  TBody = any,
  TQuery = Query,
  TParams = ParamsDictionary
> extends Request<TParams, any, TBody, TQuery> {
  validatedData: {
    body?: TBody;
    query?: TQuery;
    params?: TParams;
  };
}

/**
 * Validation result interface
 * Represents the outcome of a validation operation
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Standardized validation error format
 * Ensures consistent error reporting across the application
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  type?: string;
  context?: any;
}

/**
 * Validation options interface
 * Configures validation behavior
 */
export interface ValidationOptions {
  stripUnknown?: boolean;
  abortEarly?: boolean;
  allowUnknown?: boolean;
  context?: any;
  errorClass?: new (message: string) => Error;
}

/**
 * Type helper to infer schema type from Joi schema
 */
export type InferSchema<T extends Joi.Schema> = T extends Joi.Schema<infer U> ? U : never;

/**
 * Validated route handler type
 * Ensures type safety for route handlers with validated data
 */
export type ValidatedHandler<
  TBody = any,
  TQuery = any,
  TParams = any
> = (
  req: ValidatedRequest<TBody, TQuery, TParams>,
  res: Response,
  next: NextFunction
) => Promise<any> | any;

/**
 * Async validated handler wrapper type
 */
export type AsyncValidatedHandler<
  TBody = any,
  TQuery = any,
  TParams = any
> = (
  req: ValidatedRequest<TBody, TQuery, TParams>,
  res: Response
) => Promise<any>;

/**
 * Schema builder function type
 * For dynamic schema generation
 */
export type SchemaBuilder<T = any> = (context?: any) => Joi.Schema<T>;

/**
 * Validation metadata for documentation
 */
export interface ValidationMetadata {
  description?: string;
  examples?: any[];
  tags?: string[];
  deprecated?: boolean;
} 