import Joi from 'joi';
import { BaseSchemas } from './BaseSchemas';

/**
 * Echo Score validation schemas
 * Validates Echo Score related operations
 */
export namespace EchoScoreValidation {
  /**
   * Get echo score history query parameters
   */
  export interface HistoryQuery {
    days?: number;
  }

  export const historyQuery = Joi.object<HistoryQuery>({
    days: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .optional()
      .description('Number of days of history to retrieve')
  });

  /**
   * Get echo score progress query parameters
   */
  export interface ProgressQuery {
    period?: 'daily' | 'weekly';
  }

  export const progressQuery = Joi.object<ProgressQuery>({
    period: Joi.string()
      .valid('daily', 'weekly')
      .default('daily')
      .description('Progress aggregation period')
  });

  /**
   * Calculate echo score request body (for future use)
   * Currently empty but can be extended with calculation options
   */
  export interface CalculateOptions {
    includeProjections?: boolean;
    recalculate?: boolean;
  }

  export const calculateOptions = Joi.object<CalculateOptions>({
    includeProjections: Joi.boolean()
      .optional()
      .description('Include future score projections'),
    recalculate: Joi.boolean()
      .optional()
      .description('Force recalculation even if recent score exists')
  });
} 