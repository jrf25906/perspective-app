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
import { transformRequest } from '../middleware/transformRequest';
import Joi from 'joi';
import { 
  validate, 
  ChallengeValidation, 
  BaseSchemas,
  ProfileValidation
} from '../validation';

const router = Router();

// Public routes (must be defined before authRequired middleware)
router.get("/leaderboard", 
  validate({ query: ChallengeValidation.leaderboard }),
  getLeaderboard
);

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
  validate({ 
    query: BaseSchemas.pagination.append({
      count: Joi.number().integer().min(1).max(10).optional()
    })
  }),
  getAdaptiveRecommendations
);

// GET /challenge/progress - Get user's learning progress
router.get('/progress', getUserProgress);

// POST /challenge/:id/submit - Submit a challenge answer
router.post('/:id/submit',
  transformRequest('challengeSubmission'),
  validate({ 
    params: Joi.object({ id: BaseSchemas.id }),
    body: ChallengeValidation.submitAnswer
  }),
  submitChallenge
);

// GET /challenge/stats - Get user's challenge statistics
router.get('/stats',
  validate({ query: ChallengeValidation.challengeStats }),
  getChallengeStats
);

// GET /challenge/history - Get user's challenge history
router.get('/history',
  validate({ query: BaseSchemas.paginatedQuery }),
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
  validate({ params: Joi.object({ id: BaseSchemas.id }) }),
  getChallengeById
);

// GET /challenge/types/:type - Get challenges by type
router.get('/types/:type',
  validate({ 
    params: Joi.object({
      type: Joi.string().valid(...ChallengeValidation.challengeTypes).required()
    }),
    query: Joi.object({
      difficulty: Joi.string().valid(...ChallengeValidation.difficultyLevels).optional(),
      limit: Joi.number().integer().min(1).max(100).default(10),
      offset: Joi.number().integer().min(0).default(0)
    })
  }),
  getChallengesByType
);

// POST /challenge/batch-submit - Submit multiple challenges
router.post('/batch-submit',
  validate({ body: ChallengeValidation.batchSubmit }),
  batchSubmitChallenges
);

export default router;
