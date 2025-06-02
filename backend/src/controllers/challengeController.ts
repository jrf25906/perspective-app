import logger from '../utils/logger';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { IChallengeService } from '../interfaces/IChallengeService';
import { IAdaptiveChallengeService } from '../interfaces/IAdaptiveChallengeService';
import { getService } from '../di/serviceRegistration';
import { ServiceTokens } from '../di/container';
import { asyncHandler } from '../utils/asyncHandler';
import { ChallengeTransformService } from '../services/ChallengeTransformService';
import { RequestTransformService } from '../services/RequestTransformService';
// Get services from DI container
const getChallengeService = (): IChallengeService => getService(ServiceTokens.ChallengeService);
const getAdaptiveChallengeService = (): IAdaptiveChallengeService => getService(ServiceTokens.AdaptiveChallengeService);
// GET /challenge/today
export const getTodayChallenge = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id; // Safe to use ! since authRequired middleware ensures this exists
    const challengeService = getChallengeService();
    const challenge = await challengeService.getTodaysChallengeForUser(userId);
    if (!challenge) {
        res.status(404).json({ error: 'No challenge available for today' });
        return;
    }
    // Log the raw challenge data before transformation
    logger.info(`🔍 Raw challenge from database: ${JSON.stringify(challenge, null, 2)}`);
    // Transform response to match iOS app expectations
    const transformedChallenge = ChallengeTransformService.transformChallengeForAPI(challenge);
    if (!transformedChallenge) {
        res.status(500).json({ error: 'Failed to transform challenge' });
        return;
    }
    // Log the transformed challenge being sent to iOS
    logger.info(`📱 Transformed challenge for iOS: ${JSON.stringify(transformedChallenge, null, 2)}`);
    // Validate critical fields exist
    const requiredFields = ['id', 'type', 'title', 'prompt', 'content', 'difficultyLevel', 'createdAt', 'updatedAt'];
    const missingFields = requiredFields.filter(field => transformedChallenge[field] === undefined);
    if (missingFields.length > 0) {
        logger.error('❌ Missing required fields:', missingFields);
    }
    res.json(transformedChallenge);
});
// GET /challenge/adaptive/next
export const getAdaptiveChallenge = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const adaptiveChallengeService = getAdaptiveChallengeService();
    const challenge = await adaptiveChallengeService.getNextChallengeForUser(userId);
    if (!challenge) {
        res.status(404).json({ error: 'No adaptive challenge available' });
        return;
    }
    // Transform response to match iOS app expectations
    const transformedChallenge = ChallengeTransformService.transformChallengeForAPI(challenge);
    if (!transformedChallenge) {
        res.status(500).json({ error: 'Failed to transform challenge' });
        return;
    }
    res.json(transformedChallenge);
});
// GET /challenge/adaptive/recommendations
export const getAdaptiveRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const count = parseInt(req.query.count as string) || 3;
    const adaptiveChallengeService = getAdaptiveChallengeService();
    const recommendations = await adaptiveChallengeService.getAdaptiveChallengeRecommendations(userId, count);
    // Remove correct_answers from recommendations
    const sanitizedRecommendations = recommendations.map(challenge => {
        const { correct_answer, ...challengeData } = challenge;
        return challengeData;
    });
    res.json({
        recommendations: sanitizedRecommendations,
        count: sanitizedRecommendations.length
    });
});
// GET /challenge/progress
export const getUserProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const adaptiveChallengeService = getAdaptiveChallengeService();
    const progress = await adaptiveChallengeService.analyzeUserProgress(userId);
    res.json(progress);
});
// POST /challenge/:id/submit
export const submitChallenge = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const challengeId = Number(req.params.id);
    // Log the request body for debugging (already transformed by middleware)
    logger.info(`📥 Challenge submission request: ${JSON.stringify(req.body, null, 2)}`);
    // Validate challenge ID
    if (!Number.isInteger(challengeId) || challengeId <= 0) {
        res.status(400).json({ error: 'Invalid challenge ID' });
        return;
    }
    // Body has already been transformed and validated by middleware
    const { answer, timeSpentSeconds } = req.body;
    const challengeService = getChallengeService();
    const result = await challengeService.submitChallenge(userId, challengeId, answer, timeSpentSeconds);
    // Transform response to match iOS app expectations
    const transformedResult = ChallengeTransformService.transformChallengeResultForAPI(result);
    res.json(transformedResult);
});
// GET /challenge/stats
export const getChallengeStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const challengeService = getChallengeService();
    const stats = await challengeService.getUserChallengeStats(userId);
    // Transform response to match iOS app expectations
    const transformedStats = await ChallengeTransformService.transformChallengeStatsForAPI(stats, userId);
    res.json(transformedStats);
});
// GET /challenge/leaderboard
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    const timeframe = req.query.timeframe as 'daily' | 'weekly' | 'allTime' || 'weekly';
    const challengeService = getChallengeService();
    const leaderboard = await challengeService.getLeaderboard(timeframe);
    // Transform response to match iOS app expectations
    const transformedLeaderboard = leaderboard.map(entry => ChallengeTransformService.transformLeaderboardEntryForAPI(entry));
    res.json(transformedLeaderboard);
});
// GET /challenge/history
export const getChallengeHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const challengeService = getChallengeService();
    const history = await challengeService.getUserChallengeHistory(userId, limit, offset);
    res.json({
        history,
        page,
        limit
    });
});
// GET /challenge/:id
export const getChallengeById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const challengeId = Number(req.params.id);
    if (!Number.isInteger(challengeId) || challengeId <= 0) {
        res.status(400).json({ error: 'Invalid challenge ID' });
        return;
    }
    const challengeService = getChallengeService();
    const challenge = await challengeService.getChallengeById(challengeId);
    if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
    }
    // Remove correct_answer from response
    const { correct_answer, ...challengeData } = challenge;
    res.json(challengeData);
});
// GET /challenge/types/:type
export const getChallengesByType = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type } = req.params;
    const { difficulty, limit = '10', offset = '0' } = req.query;
    const challengeService = getChallengeService();
    const challenges = await challengeService.getAllChallenges({
        type: type as any,
        difficulty: difficulty as any,
        isActive: true
    });
    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedChallenges = challenges.slice(startIndex, endIndex);
    // Remove correct_answers
    const sanitizedChallenges = paginatedChallenges.map(challenge => {
        const { correct_answer, ...challengeData } = challenge;
        return challengeData;
    });
    res.json({
        challenges: sanitizedChallenges,
        total: challenges.length,
        offset: startIndex,
        limit: parseInt(limit as string)
    });
});
// GET /challenge/performance
export const getChallengePerformance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { period = '7d' } = req.query;
    const challengeService = getChallengeService();
    const adaptiveChallengeService = getAdaptiveChallengeService();
    // Get user stats and progress analysis
    const [stats, progress] = await Promise.all([
        challengeService.getUserChallengeStats(userId),
        adaptiveChallengeService.analyzeUserProgress(userId)
    ]);
    // Calculate performance metrics based on period
    const performanceData = {
        overall: {
            totalChallenges: stats.total_completed,
            accuracy: stats.total_completed > 0
                ? ((stats.total_correct / stats.total_completed) * 100).toFixed(1)
                : 0,
            currentStreak: stats.current_streak,
            longestStreak: stats.longest_streak
        },
        byType: stats.type_performance,
        byDifficulty: stats.difficulty_performance,
        progress,
        period
    };
    res.json(performanceData);
});
// POST /challenge/batch-submit
export const batchSubmitChallenges = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { submissions } = req.body;
    if (!Array.isArray(submissions) || submissions.length === 0) {
        res.status(400).json({ error: 'Submissions array is required' });
        return;
    }
    if (submissions.length > 10) {
        res.status(400).json({ error: 'Maximum 10 submissions allowed per batch' });
        return;
    }
    const challengeService = getChallengeService();
    const results = [];
    for (const submission of submissions) {
        const { challengeId, answer, timeSpentSeconds } = submission;
        if (!challengeId || !answer || timeSpentSeconds === undefined) {
            results.push({
                challengeId,
                error: 'Invalid submission data'
            });
            continue;
        }
        try {
            const result = await challengeService.submitChallenge(userId, challengeId, answer, timeSpentSeconds);
            results.push({
                challengeId,
                ...result
            });
        }
        catch (error) {
            results.push({
                challengeId,
                error: error.message
            });
        }
    }
    res.json({ results });
});
// TODO: Add more endpoints as needed
