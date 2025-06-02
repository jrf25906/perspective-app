import Joi from 'joi';
import { BaseSchemas } from './BaseSchemas';

/**
 * Network Diagnostic validation schemas
 * Validates network diagnostic and connectivity operations
 */
export namespace NetworkDiagnosticValidation {
  /**
   * Client identifier parameter
   */
  export interface ClientIdentifierParam {
    identifier: string;
  }

  export const clientIdentifierParam = Joi.object<ClientIdentifierParam>({
    identifier: Joi.string()
      .pattern(/^[a-zA-Z0-9\-_]+$/)
      .min(3)
      .max(64)
      .required()
      .description('Client identifier (device ID, session ID, etc.)')
  });

  /**
   * Test connectivity query parameters
   */
  export interface TestConnectivityQuery {
    includeHeaders?: boolean;
    includeTiming?: boolean;
  }

  export const testConnectivityQuery = Joi.object<TestConnectivityQuery>({
    includeHeaders: Joi.boolean()
      .optional()
      .description('Include request headers in response'),
    includeTiming: Joi.boolean()
      .optional()
      .description('Include timing information')
  });

  /**
   * CORS violations query parameters
   */
  export interface CorsViolationsQuery {
    limit?: number;
    origin?: string;
    severity?: 'low' | 'medium' | 'high';
  }

  export const corsViolationsQuery = Joi.object<CorsViolationsQuery>({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(50),
    origin: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .optional(),
    severity: Joi.string()
      .valid('low', 'medium', 'high')
      .optional()
  });

  /**
   * iOS clients query parameters
   */
  export interface IOSClientsQuery {
    active?: boolean;
    version?: string;
  }

  export const iosClientsQuery = Joi.object<IOSClientsQuery>({
    active: Joi.boolean()
      .optional()
      .description('Filter by active status'),
    version: Joi.string()
      .pattern(/^\d+\.\d+(\.\d+)?$/)
      .optional()
      .description('Filter by iOS app version')
  });

  /**
   * Clear diagnostics body
   */
  export interface ClearDiagnosticsBody {
    type?: 'cors' | 'clients' | 'all';
    olderThan?: string;
  }

  export const clearDiagnosticsBody = Joi.object<ClearDiagnosticsBody>({
    type: Joi.string()
      .valid('cors', 'clients', 'all')
      .default('all'),
    olderThan: BaseSchemas.isoDate
      .optional()
      .description('Clear records older than this date')
  });
} 