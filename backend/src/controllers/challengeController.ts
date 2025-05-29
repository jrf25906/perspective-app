import { Request, Response } from 'express';
const challengeService = require('../services/challengeService').default;
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

// TODO: Add more endpoints as needed
