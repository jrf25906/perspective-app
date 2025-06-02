import Joi from 'joi';
import { BaseSchemas } from './BaseSchemas';
import { ContentValidation } from './ContentSchemas';

/**
 * Admin validation schemas
 * Comprehensive validation for admin panel operations
 */
export namespace AdminValidation {
  // ============= News Sources Management =============
  
  /**
   * Get sources query parameters
   */
  export interface GetSourcesQuery {
    bias?: typeof ContentValidation.biasRatings[number];
    active?: boolean;
    page?: number;
    limit?: number;
  }

  export const getSourcesQuery = BaseSchemas.paginatedQuery.concat(
    Joi.object<GetSourcesQuery>({
      bias: Joi.string()
        .valid(...ContentValidation.biasRatings)
        .optional(),
      active: Joi.boolean().optional()
    })
  );

  /**
   * Create news source body
   */
  export interface CreateSourceBody {
    name: string;
    domain: string;
    bias_rating: typeof ContentValidation.biasRatings[number];
    credibility_score?: number;
    description?: string;
    logo_url?: string;
  }

  export const createSource = Joi.object<CreateSourceBody>({
    name: BaseSchemas.mediumString.required(),
    domain: Joi.string()
      .domain({ tlds: { allow: true } })
      .required(),
    bias_rating: Joi.string()
      .valid(...ContentValidation.biasRatings)
      .required(),
    credibility_score: Joi.number()
      .min(0)
      .max(100)
      .default(50),
    description: BaseSchemas.longString.optional(),
    logo_url: BaseSchemas.url.optional()
  });

  /**
   * Update news source body
   */
  export const updateSource = Joi.object({
    name: BaseSchemas.mediumString.optional(),
    bias_rating: Joi.string()
      .valid(...ContentValidation.biasRatings)
      .optional(),
    credibility_score: Joi.number()
      .min(0)
      .max(100)
      .optional(),
    description: BaseSchemas.longString.optional(),
    logo_url: BaseSchemas.url.optional(),
    is_active: Joi.boolean().optional()
  }).min(1); // At least one field required

  // ============= Content Management =============
  
  /**
   * Get content query parameters
   */
  export interface GetContentQuery {
    bias?: typeof ContentValidation.biasRatings[number];
    source_id?: number;
    verified?: boolean;
    active?: boolean;
    topic?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }

  export const getContentQuery = BaseSchemas.paginatedQuery.concat(
    Joi.object<GetContentQuery>({
      bias: Joi.string()
        .valid(...ContentValidation.biasRatings)
        .optional(),
      source_id: BaseSchemas.id.optional(),
      verified: Joi.boolean().optional(),
      active: Joi.boolean().optional(),
      topic: BaseSchemas.mediumString.optional(),
      date_from: BaseSchemas.isoDate.optional(),
      date_to: BaseSchemas.isoDate
        .when('date_from', {
          is: Joi.exist(),
          then: Joi.date().min(Joi.ref('date_from'))
        })
        .optional()
    })
  );

  /**
   * Content ingestion body
   */
  export interface IngestContentBody {
    topics: string[];
  }

  export const ingestContent = Joi.object<IngestContentBody>({
    topics: Joi.array()
      .items(BaseSchemas.mediumString)
      .min(1)
      .max(20)
      .required()
      .unique()
  });

  /**
   * Verify content body
   */
  export interface VerifyContentBody {
    verified?: boolean;
  }

  export const verifyContent = Joi.object<VerifyContentBody>({
    verified: Joi.boolean().default(true)
  });

  /**
   * Moderate content body
   */
  export interface ModerateContentBody {
    action: 'approve' | 'reject' | 'flag' | 'remove';
    reason: string;
  }

  export const moderateContent = Joi.object<ModerateContentBody>({
    action: Joi.string()
      .valid('approve', 'reject', 'flag', 'remove')
      .required(),
    reason: BaseSchemas.mediumString
      .min(10)
      .required()
  });

  // ============= Bias Analysis =============
  
  /**
   * User bias analysis query
   */
  export interface BiasAnalysisQuery {
    days?: number;
  }

  export const biasAnalysisQuery = Joi.object<BiasAnalysisQuery>({
    days: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .default(30)
  });

  // ============= Content Curation =============
  
  /**
   * Curate topic body
   */
  export interface CurateTopicBody {
    topic: string;
    minBiasVariety?: number;
    maxAge?: number;
    minArticles?: number;
  }

  export const curateTopic = Joi.object<CurateTopicBody>({
    topic: BaseSchemas.mediumString.required(),
    minBiasVariety: Joi.number()
      .integer()
      .min(1)
      .max(7)
      .default(3),
    maxAge: Joi.number()
      .integer()
      .min(1)
      .max(30)
      .default(7)
      .description('Maximum age in days'),
    minArticles: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(5)
  });

  // ============= Statistics =============
  
  /**
   * Content statistics query
   */
  export interface StatsQuery {
    timeframe?: 'day' | 'week' | 'month' | 'year';
  }

  export const statsQuery = Joi.object<StatsQuery>({
    timeframe: Joi.string()
      .valid('day', 'week', 'month', 'year')
      .default('week')
  });

  // ============= Ingestion Scheduler =============
  
  /**
   * Run ingestion body
   */
  export interface RunIngestionBody {
    topics?: string[];
  }

  export const runIngestion = Joi.object<RunIngestionBody>({
    topics: Joi.array()
      .items(BaseSchemas.mediumString)
      .optional()
  });

  /**
   * Update scheduler config
   */
  export interface SchedulerConfig {
    schedule?: string;
    defaultTopics?: string[];
    maxArticlesPerIngestion?: number;
    enabled?: boolean;
  }

  export const schedulerConfig = Joi.object<SchedulerConfig>({
    schedule: Joi.string()
      .pattern(/^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(((([\d,\-\/]+|\*) ){4}[\d,\-\/]+|\*))$/)
      .optional()
      .description('Cron expression'),
    defaultTopics: Joi.array()
      .items(BaseSchemas.mediumString)
      .max(50)
      .optional(),
    maxArticlesPerIngestion: Joi.number()
      .integer()
      .min(10)
      .max(1000)
      .optional(),
    enabled: Joi.boolean().optional()
  }).min(1); // At least one field required

  // ============= Common Param Schemas =============
  
  export const idParam = Joi.object({
    id: BaseSchemas.id
  });

  export const userIdParam = Joi.object({
    userId: BaseSchemas.id
  });

  export const sourceIdParam = Joi.object({
    sourceId: BaseSchemas.id
  });
} 