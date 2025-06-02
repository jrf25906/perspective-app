import { Router } from "express";
import { 
  getTodayChallenge, 
  submitChallenge,
  getChallengeStats,
  getLeaderboard,
  getAdaptiveChallenge,
  getAdaptiveRecommendations,
  getUserProgress,
  getChallengeHistory,
  getChallengeById,
  getChallengesByType,
  getChallengePerformance,
  batchSubmitChallenges
} from "../controllers/challengeController";
import { authenticateToken } from "../middleware/auth";
import { authRequired } from "../middleware/authRequired";
import { validate, challengeSchemas, commonSchemas } from '../middleware/validation';
import { transformRequest } from '../middleware/transformRequest';
import Joi from 'joi';

const router = Router();

// Public routes (must be defined before authRequired middleware)
router.get("/leaderboard", getLeaderboard);

// Apply authentication middleware to all subsequent routes
router.use(authenticateToken);
router.use(authRequired);

// Protected routes - all require authentication

// GET /challenge/today - Get today's challenge for the user
router.get('/today', getTodayChallenge);

// GET /challenge/adaptive/next - Get next adaptive challenge
router.get('/adaptive/next', getAdaptiveChallenge);

// GET /challenge/adaptive/recommendations - Get challenge recommendations
router.get('/adaptive/recommendations', 
  validate({ query: commonSchemas.pagination.keys({ count: Joi.number().integer().min(1).max(10).optional() }) }),
  getAdaptiveRecommendations
);

// GET /challenge/progress - Get user's learning progress
router.get('/progress', getUserProgress);

// POST /challenge/:id/submit - Submit a challenge answer
router.post('/:id/submit',
  transformRequest('challengeSubmission'),
  validate({ 
    params: commonSchemas.idParam,
    body: challengeSchemas.submitChallenge 
  }),
  submitChallenge
);

// GET /challenge/stats - Get user's challenge statistics
router.get('/stats', getChallengeStats);

// GET /challenge/history - Get user's challenge history
router.get('/history',
  validate({ query: commonSchemas.pagination }),
  getChallengeHistory
);

// GET /challenge/performance - Get performance analytics
router.get('/performance',
  validate({ 
    query: Joi.object({
      period: Joi.string().pattern(/^\d+[dwmy]$/).optional() // e.g., 7d, 2w, 1m, 1y
    })
  }),
  getChallengePerformance
);

// GET /challenge/:id - Get specific challenge details
router.get('/:id',
  validate({ params: commonSchemas.idParam }),
  getChallengeById
);

// GET /challenge/types/:type - Get challenges by type
router.get('/types/:type',
  validate({ 
    params: Joi.object({
      type: Joi.string().required()
    }),
    query: Joi.object({
      difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
      limit: Joi.number().integer().min(1).max(100).default(10),
      offset: Joi.number().integer().min(0).default(0)
    })
  }),
  getChallengesByType
);

// POST /challenge/batch-submit - Submit multiple challenges
router.post('/batch-submit',
  validate({ 
    body: Joi.object({
      submissions: Joi.array().items(
        Joi.object({
          challengeId: Joi.number().integer().positive().required(),
          answer: Joi.alternatives().try(
            Joi.string(),
            Joi.number(),
            Joi.array(),
            Joi.object()
          ).required(),
          timeSpentSeconds: Joi.number().integer().min(0).required()
        })
      ).min(1).max(10).required()
    })
  }),
  batchSubmitChallenges
);

export default router;
