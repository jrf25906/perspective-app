import Joi from 'joi';
import { BaseSchemas } from './BaseSchemas';

/**
 * Content validation schemas
 * Handles content/article related validation
 */
export namespace ContentValidation {
  /**
   * Bias ratings enum
   */
  export const biasRatings = ['far-left', 'left', 'center-left', 'center', 'center-right', 'right', 'far-right'] as const;

  /**
   * Content search query
   */
  export interface ContentSearchQuery {
    q: string;
    bias?: typeof biasRatings[number][];
    dateFrom?: string;
    dateTo?: string;
    sources?: number[];
    page?: number;
    limit?: number;
  }

  export const searchContent = BaseSchemas.paginatedQuery.concat(
    Joi.object<ContentSearchQuery>({
      q: Joi.string()
        .min(2)
        .max(200)
        .required()
        .messages({
          'string.min': 'Search query must be at least 2 characters',
          'string.max': 'Search query cannot exceed 200 characters'
        }),
      bias: Joi.array()
        .items(Joi.string().valid(...biasRatings))
        .optional(),
      dateFrom: BaseSchemas.isoDate.optional(),
      dateTo: BaseSchemas.isoDate
        .when('dateFrom', {
          is: Joi.exist(),
          then: Joi.date().min(Joi.ref('dateFrom'))
        })
        .optional(),
      sources: Joi.array()
        .items(BaseSchemas.id)
        .max(20)
        .optional()
    })
  );

  /**
   * Get articles by topic
   */
  export interface TopicArticlesQuery {
    count?: number;
    excludeRead?: boolean;
  }

  export const topicArticles = Joi.object<TopicArticlesQuery>({
    count: Joi.number()
      .integer()
      .min(1)
      .max(20)
      .default(3),
    excludeRead: Joi.boolean().default(false)
  });

  /**
   * Get trending topics query
   */
  export interface TrendingTopicsQuery {
    days?: number;
    limit?: number;
  }

  export const trendingTopics = Joi.object<TrendingTopicsQuery>({
    days: Joi.number()
      .integer()
      .min(1)
      .max(30)
      .default(7),
    limit: Joi.number()
      .integer()
      .min(5)
      .max(50)
      .default(10)
  });

  /**
   * Feed query parameters
   */
  export interface FeedQuery {
    date?: string;
    category?: string;
    includeRead?: boolean;
  }

  export const feedQuery = Joi.object<FeedQuery>({
    date: BaseSchemas.isoDate.default(() => new Date().toISOString()),
    category: Joi.string()
      .valid('politics', 'technology', 'business', 'science', 'health', 'entertainment', 'sports')
      .optional(),
    includeRead: Joi.boolean().default(false)
  });

  /**
   * Recommendations query
   */
  export interface RecommendationsQuery {
    topic: string;
    count?: number;
    diversityLevel?: 'low' | 'medium' | 'high';
  }

  export const recommendations = Joi.object<RecommendationsQuery>({
    topic: BaseSchemas.mediumString.required(),
    count: Joi.number()
      .integer()
      .min(3)
      .max(20)
      .default(6),
    diversityLevel: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium')
  });

  /**
   * Content history query
   */
  export interface ContentHistoryQuery {
    days?: number;
    category?: string;
    includeMetrics?: boolean;
  }

  export const contentHistory = BaseSchemas.paginatedQuery.concat(
    Joi.object<ContentHistoryQuery>({
      days: Joi.number()
        .integer()
        .min(1)
        .max(90)
        .default(30),
      category: Joi.string().optional(),
      includeMetrics: Joi.boolean().default(false)
    })
  );

  /**
   * Bias analysis query
   */
  export interface BiasAnalysisQuery {
    days?: number;
    detailed?: boolean;
  }

  export const biasAnalysis = Joi.object<BiasAnalysisQuery>({
    days: Joi.number()
      .integer()
      .min(7)
      .max(365)
      .default(30),
    detailed: Joi.boolean().default(false)
  });

  /**
   * Report content issue
   */
  export interface ReportContentBody {
    reason: 'misinformation' | 'bias' | 'inappropriate' | 'outdated' | 'other';
    description: string;
    evidence?: string;
  }

  export const reportContent = Joi.object<ReportContentBody>({
    reason: Joi.string()
      .valid('misinformation', 'bias', 'inappropriate', 'outdated', 'other')
      .required(),
    description: BaseSchemas.mediumString
      .min(20)
      .required()
      .messages({
        'string.min': 'Please provide a detailed description (at least 20 characters)'
      }),
    evidence: BaseSchemas.longString.optional()
  });
} 