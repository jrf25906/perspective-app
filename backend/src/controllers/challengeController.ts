import { Request, Response } from 'express';
import challengeService from '../services/challengeService';
import adaptiveChallengeService from '../services/adaptiveChallengeService';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /challenge/today
export const getTodayChallenge = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const challenge = await challengeService.getTodaysChallengeForUser(userId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'No challenge available for today' });
    }
    
    // Remove the correct_answer from the response
    const { correct_answer, ...challengeData } = challenge;
    
    res.json(challengeData);
  } catch (error) {
    console.error('Error getting today\'s challenge:', error);
    res.status(500).json({ error: 'Failed to get today\'s challenge' });
  }
};

// GET /challenge/adaptive/next
export const getAdaptiveChallenge = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const challenge = await adaptiveChallengeService.getNextChallengeForUser(userId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'No adaptive challenge available' });
    }
    
    // Remove the correct_answer from the response
    const { correct_answer, ...challengeData } = challenge;
    
    res.json(challengeData);
  } catch (error) {
    console.error('Error getting adaptive challenge:', error);
    res.status(500).json({ error: 'Failed to get adaptive challenge' });
  }
};

// GET /challenge/adaptive/recommendations
export const getAdaptiveRecommendations = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const count = parseInt(req.query.count as string) || 3;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
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
  } catch (error) {
    console.error('Error getting adaptive recommendations:', error);
    res.status(500).json({ error: 'Failed to get adaptive recommendations' });
  }
};

// GET /challenge/progress
export const getUserProgress = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const progress = await adaptiveChallengeService.analyzeUserProgress(userId);
    
    res.json(progress);
  } catch (error) {
    console.error('Error analyzing user progress:', error);
    res.status(500).json({ error: 'Failed to analyze user progress' });
  }
};

// POST /challenge/:id/submit
export const submitChallenge = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const challengeId = parseInt(req.params.id);
    const { answer, timeSpentSeconds } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!answer || timeSpentSeconds === undefined) {
      return res.status(400).json({ error: 'Answer and timeSpentSeconds are required' });
    }
    
    const result = await challengeService.submitChallenge(
      userId,
      challengeId,
      answer,
      timeSpentSeconds
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error submitting challenge:', error);
    res.status(500).json({ error: 'Failed to submit challenge' });
  }
};

// GET /challenge/stats
export const getChallengeStats = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const stats = await challengeService.getUserChallengeStats(userId);
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting challenge stats:', error);
    res.status(500).json({ error: 'Failed to get challenge stats' });
  }
};

// GET /challenge/leaderboard
export const getLeaderboard = async (req: any, res: any) => {
  try {
    const timeframe = req.query.timeframe as 'daily' | 'weekly' | 'allTime' || 'weekly';
    
    const leaderboard = await challengeService.getLeaderboard(timeframe);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

// GET /challenge/history
export const getChallengeHistory = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const offset = (page - 1) * limit;
    
    const history = await challengeService.getUserChallengeHistory(userId, limit, offset);
    
    res.json({
      history,
      page,
      limit
    });
  } catch (error) {
    console.error('Error getting challenge history:', error);
    res.status(500).json({ error: 'Failed to get challenge history' });
  }
};

// POST /challenge
export const createChallenge = async (req: Request, res: Response) => {
  try {
    const challenge = await challengeService.createChallenge(req.body);
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
};

// PUT /challenge/:id
export const updateChallenge = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await challengeService.updateChallenge(id, req.body);

    if (!updated) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
};

// DELETE /challenge/:id
export const deleteChallenge = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await challengeService.deleteChallenge(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
};

// TODO: Add more endpoints as needed
