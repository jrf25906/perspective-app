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

// Transform leaderboard entry to match iOS app expectations
function transformLeaderboardForIOS(leaderboard: any[]) {
  return leaderboard.map(entry => ({
    id: entry.userId, // Use userId as the id
    username: entry.username,
    avatarUrl: null, // TODO: Get avatar URL from user profile
    challengesCompleted: entry.challengesCompleted,
    totalXp: entry.score || 0, // Map score to totalXp
    correctAnswers: Math.round((entry.accuracy / 100) * entry.challengesCompleted) // Calculate from accuracy
  }));
}

// Transform challenge stats to match iOS app expectations
function transformChallengeStatsForIOS(stats: any) {
  // Calculate average accuracy
  const averageAccuracy = stats.total_completed > 0 
    ? (stats.total_correct / stats.total_completed) * 100 
    : 0.0;

  // Transform type performance to challengesByType format
  const challengesByType: { [key: string]: number } = {};
  if (stats.type_performance) {
    Object.keys(stats.type_performance).forEach(type => {
      challengesByType[type] = stats.type_performance[type].completed;
    });
  }

  return {
    totalCompleted: stats.total_completed,
    currentStreak: stats.current_streak,
    longestStreak: stats.longest_streak,
    averageAccuracy: averageAccuracy,
    totalXpEarned: 0, // TODO: Need to calculate from submissions
    challengesByType: challengesByType,
    recentActivity: [] // TODO: Need to get recent activity data
  };
}

// Transform challenge result to match iOS app expectations
function transformChallengeResultForIOS(result: any) {
  return {
    isCorrect: result.isCorrect,
    feedback: result.feedback,
    xpEarned: result.xpEarned,
    streakInfo: {
      current: result.streakInfo.currentStreak,
      longest: result.streakInfo.longestStreak || 0, // Need to get actual longest streak
      isActive: result.streakInfo.streakMaintained
    }
  };
}

// Transform challenge to match iOS app expectations
function transformChallengeForIOS(challenge: any) {
  const difficultyMap: { [key: string]: number } = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'expert': 4  // Add expert level
  };

  // Extract options from content if they exist
  let options = null;
  let content = challenge.content;
  
  // Ensure content is an object
  if (!content) {
    content = {};
  } else if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse content JSON:', e);
      // If parsing fails, wrap the string in an object
      content = { text: content };
    }
  }
  
  // Handle options extraction
  if (content && content.options) {
    options = content.options;
    // Remove options from content since iOS expects them at root level
    const { options: _, ...contentWithoutOptions } = content;
    content = contentWithoutOptions;
  }
  
  // Ensure content has valid structure for iOS
  const normalizedContent = {
    text: content.text || null,
    articles: content.articles || null,
    visualization: content.visualization || null,
    questions: content.questions || null,
    additionalContext: content.additionalContext || null,
    question: content.question || null,
    prompt: content.prompt || null,
    referenceMaterial: content.referenceMaterial || null,
    scenario: content.scenario || null,
    stakeholders: content.stakeholders || null,
    considerations: content.considerations || null
  };

  // Format dates properly
  const formatDate = (date: any): string => {
    if (!date) return new Date().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') {
      // Try to parse and re-format
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }
    return new Date().toISOString();
  };

  return {
    id: challenge.id,
    type: challenge.type,
    title: challenge.title || 'Untitled Challenge',
    prompt: challenge.description || challenge.prompt || 'No prompt available',
    content: normalizedContent,
    options: options,
    correctAnswer: null, // Don't expose correct answer to client
    explanation: challenge.explanation || '',
    difficultyLevel: difficultyMap[challenge.difficulty] || 1, // Convert string to int with default
    requiredArticles: null, // Not implemented yet
    isActive: challenge.is_active !== false, // Default to true
    createdAt: formatDate(challenge.created_at),
    updatedAt: formatDate(challenge.updated_at),
    estimatedTimeMinutes: challenge.estimated_time_minutes || 5
  };
}

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
  console.log('🔍 Raw challenge from database:', JSON.stringify(challenge, null, 2));
  
  // Transform response to match iOS app expectations
  const transformedChallenge = transformChallengeForIOS(challenge);
  
  // Log the transformed challenge being sent to iOS
  console.log('📱 Transformed challenge for iOS:', JSON.stringify(transformedChallenge, null, 2));
  
  // Validate critical fields exist
  const requiredFields = ['id', 'type', 'title', 'prompt', 'content', 'difficultyLevel', 'createdAt', 'updatedAt'];
  const missingFields = requiredFields.filter(field => transformedChallenge[field] === undefined);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields);
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
  const transformedChallenge = transformChallengeForIOS(challenge);
  
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
  
  // Validate challenge ID
  if (!Number.isInteger(challengeId) || challengeId <= 0) {
    res.status(400).json({ error: 'Invalid challenge ID' });
    return;
  }
  
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
  
  // Transform response to match iOS app expectations
  const transformedResult = transformChallengeResultForIOS(result);
  
  res.json(transformedResult);
});

// GET /challenge/stats
export const getChallengeStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const challengeService = getChallengeService();
  const stats = await challengeService.getUserChallengeStats(userId);
  
  // Transform response to match iOS app expectations
  const transformedStats = transformChallengeStatsForIOS(stats);
  
  res.json(transformedStats);
});

// GET /challenge/leaderboard
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const timeframe = req.query.timeframe as 'daily' | 'weekly' | 'allTime' || 'weekly';
  
  const challengeService = getChallengeService();
  const leaderboard = await challengeService.getLeaderboard(timeframe);
  
  // Transform response to match iOS app expectations
  const transformedLeaderboard = transformLeaderboardForIOS(leaderboard);
  
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
      const result = await challengeService.submitChallenge(
        userId,
        challengeId,
        answer,
        timeSpentSeconds
      );
      results.push({
        challengeId,
        ...result
      });
    } catch (error) {
      results.push({
        challengeId,
        error: error.message
      });
    }
  }
  
  res.json({ results });
});

// TODO: Add more endpoints as needed
