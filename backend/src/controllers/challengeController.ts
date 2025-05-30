import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { IChallengeService } from '../interfaces/IChallengeService';
import { IAdaptiveChallengeService } from '../interfaces/IAdaptiveChallengeService';
import { getService } from '../di/serviceRegistration';
import { ServiceTokens } from '../di/container';
import { asyncHandler } from '../utils/asyncHandler';

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
  
  // Remove the correct_answer from the response
  const { correct_answer, ...challengeData } = challenge;
  
  res.json(challengeData);
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
  
  // Remove the correct_answer from the response
  const { correct_answer, ...challengeData } = challenge;
  
  res.json(challengeData);
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
  const challengeId = parseInt(req.params.id);
  const { answer, timeSpentSeconds } = req.body;
  
  if (!answer || timeSpentSeconds === undefined) {
    res.status(400).json({ error: 'Answer and timeSpentSeconds are required' });
    return;
  }
  
  const challengeService = getChallengeService();
  const result = await challengeService.submitChallenge(
    userId,
    challengeId,
    answer,
    timeSpentSeconds
  );
  
  res.json(result);
});

// GET /challenge/stats
export const getChallengeStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const challengeService = getChallengeService();
  const stats = await challengeService.getUserChallengeStats(userId);
  
  res.json(stats);
});

// GET /challenge/leaderboard
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const timeframe = req.query.timeframe as 'daily' | 'weekly' | 'allTime' || 'weekly';
  
  const challengeService = getChallengeService();
  const leaderboard = await challengeService.getLeaderboard(timeframe);
  
  res.json(leaderboard);
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

// TODO: Add more endpoints as needed
