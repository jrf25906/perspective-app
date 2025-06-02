/**
 * Validation Module Index
 * Central export point for all validation components
 */

// Core components
export * from './core/types';
export { ValidationMiddleware } from './core/ValidationMiddleware';

// Schema namespaces
export { BaseSchemas } from './schemas/BaseSchemas';
export { AuthValidation } from './schemas/AuthSchemas';
export { ProfileValidation } from './schemas/ProfileSchemas';
export { ChallengeValidation } from './schemas/ChallengeSchemas';
export { ContentValidation } from './schemas/ContentSchemas';
export { EchoScoreValidation } from './schemas/EchoScoreSchemas';
export { AdminValidation } from './schemas/AdminSchemas';
export { NetworkDiagnosticValidation } from './schemas/NetworkDiagnosticSchemas';

// Convenience re-exports
export { default as Joi } from 'joi';

// Validation middleware factory
import { ValidationMiddleware } from './core/ValidationMiddleware';
export const validate = ValidationMiddleware.validate.bind(ValidationMiddleware);
export const validateIf = ValidationMiddleware.validateIf.bind(ValidationMiddleware);
export const combineSchemas = ValidationMiddleware.combine.bind(ValidationMiddleware); 