import Joi from 'joi';
import { BaseSchemas } from './BaseSchemas';

/**
 * Challenge validation schemas
 * Comprehensive validation for challenge-related operations
 */
export namespace ChallengeValidation {
  /**
   * Challenge types enum
   */
  export const challengeTypes = [
    'true_false',
    'multiple_choice', 
    'slider',
    'fill_blank',
    'match_pairs'
  ] as const;

  /**
   * Difficulty levels
   */
  export const difficultyLevels = ['beginner', 'intermediate', 'advanced'] as const;

  /**
   * Get challenges query parameters
   */
  export interface GetChallengesQuery {
    type?: typeof challengeTypes[number];
    difficulty?: typeof difficultyLevels[number];
    topic?: string;
    count?: number;
    excludeCompleted?: boolean;
    seed?: string;
  }

  export const getChallenges = BaseSchemas.paginatedQuery.concat(
    Joi.object<GetChallengesQuery>({
      type: Joi.string()
        .valid(...challengeTypes)
        .optional(),
      difficulty: Joi.string()
        .valid(...difficultyLevels)
        .optional(),
      topic: BaseSchemas.mediumString.optional(),
      count: Joi.number()
        .integer()
        .min(1)
        .max(10)
        .optional(),
      excludeCompleted: Joi.boolean().optional(),
      seed: Joi.string()
        .alphanum()
        .length(16)
        .optional()
    })
  );

  /**
   * Submit challenge answer
   */
  export interface SubmitAnswerBody {
    answer: any; // Can be string, number, array, or object
    timeSpentSeconds: number;
    metadata?: AnswerMetadata;
  }

  export interface AnswerMetadata {
    deviceType?: 'ios' | 'android' | 'web';
    appVersion?: string;
    confidence?: number;
    hints_used?: number;
  }

  export const submitAnswer = Joi.object<SubmitAnswerBody>({
    answer: Joi.alternatives()
      .try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.array().items(Joi.string()),
        Joi.array().items(Joi.number()),
        Joi.object().pattern(Joi.string(), Joi.any())
      )
      .required()
      .messages({
        'alternatives.match': 'Answer must be a string, number, boolean, array, or object'
      }),
    timeSpentSeconds: Joi.number()
      .integer()
      .min(0)
      .max(3600) // Max 1 hour
      .required(),
    metadata: Joi.object({
      deviceType: Joi.string()
        .valid('ios', 'android', 'web')
        .optional(),
      appVersion: Joi.string()
        .pattern(/^\d+\.\d+\.\d+$/)
        .optional(),
      confidence: Joi.number()
        .min(0)
        .max(100)
        .optional(),
      hints_used: Joi.number()
        .integer()
        .min(0)
        .max(5)
        .optional()
    }).optional()
  });

  /**
   * Batch submit multiple challenges
   */
  export interface BatchSubmission {
    challengeId: number;
    answer: any;
    timeSpentSeconds: number;
  }

  export interface BatchSubmitBody {
    submissions: BatchSubmission[];
  }

  export const batchSubmit = Joi.object<BatchSubmitBody>({
    submissions: Joi.array()
      .items(
        Joi.object({
          challengeId: BaseSchemas.id.required(),
          answer: submitAnswer.extract('answer'),
          timeSpentSeconds: submitAnswer.extract('timeSpentSeconds')
        })
      )
      .min(1)
      .max(10)
      .required()
  });

  /**
   * Challenge leaderboard query
   */
  export interface LeaderboardQuery {
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'allTime';
    challengeType?: typeof challengeTypes[number];
    limit?: number;
  }

  export const leaderboard = Joi.object<LeaderboardQuery>({
    timeframe: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'allTime')
      .default('weekly'),
    challengeType: Joi.string()
      .valid(...challengeTypes)
      .optional(),
    limit: Joi.number()
      .integer()
      .min(10)
      .max(100)
      .default(20)
  });

  /**
   * Challenge stats query
   */
  export interface ChallengeStatsQuery {
    period?: string;
    groupBy?: 'type' | 'difficulty' | 'day';
  }

  export const challengeStats = Joi.object<ChallengeStatsQuery>({
    period: Joi.string()
      .pattern(/^\d+[dwmy]$/) // e.g., 7d, 4w, 3m, 1y
      .default('7d'),
    groupBy: Joi.string()
      .valid('type', 'difficulty', 'day')
      .default('type')
  });

  /**
   * Challenge hint request
   */
  export interface HintRequestParams {
    id: string;
    hintLevel?: number;
  }

  export const hintRequest = Joi.object({
    params: Joi.object({
      id: BaseSchemas.id.required()
    }),
    query: Joi.object({
      hintLevel: Joi.number()
        .integer()
        .min(1)
        .max(3)
        .optional()
    })
  });

  /**
   * Report challenge issue
   */
  export interface ReportIssueBody {
    issueType: 'incorrect_answer' | 'unclear_question' | 'offensive_content' | 'technical_issue' | 'other';
    description: string;
    suggestedFix?: string;
  }

  export const reportIssue = Joi.object<ReportIssueBody>({
    issueType: Joi.string()
      .valid('incorrect_answer', 'unclear_question', 'offensive_content', 'technical_issue', 'other')
      .required(),
    description: BaseSchemas.mediumString
      .min(10)
      .required()
      .messages({
        'string.min': 'Please provide a detailed description (at least 10 characters)'
      }),
    suggestedFix: BaseSchemas.mediumString.optional()
  });

  /**
   * Challenge feedback
   */
  export interface ChallengeFeedbackBody {
    rating: number;
    difficulty_rating?: number;
    comment?: string;
    tags?: string[];
  }

  export const challengeFeedback = Joi.object<ChallengeFeedbackBody>({
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required(),
    difficulty_rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .optional(),
    comment: BaseSchemas.mediumString.optional(),
    tags: Joi.array()
      .items(
        Joi.string()
          .valid('too_easy', 'too_hard', 'interesting', 'boring', 'educational', 'confusing')
      )
      .max(3)
      .optional()
  });
} 