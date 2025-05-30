import db from '../db';
import { 
  Challenge, 
  ChallengeType, 
  DifficultyLevel, 
  ChallengeSubmission, 
  UserChallengeStats,
  DailyChallengeSelection
} from '../models/Challenge';
import { startOfDay } from 'date-fns';
import adaptiveChallengeService from './adaptiveChallengeService';
import challengeRepository from './challengeRepository';
import challengeAnswerService from './challengeAnswerService';
import xpService from './xpService';
import streakService from './streakService';
import leaderboardService from './leaderboardService';
import challengeStatsService from './challengeStatsService';

export class ChallengeService {
  /**
   * Get all active challenges from the database
   */
  async getAllChallenges(filters?: {
    type?: ChallengeType;
    difficulty?: DifficultyLevel;
    isActive?: boolean;
  }): Promise<Challenge[]> {
    return await challengeRepository.getAllChallenges(filters);
  }

  /**
   * Get a specific challenge by ID
   */
  async getChallengeById(challengeId: number): Promise<Challenge | null> {
    return await challengeRepository.getChallengeById(challengeId);
  }

  /**
   * Get today's challenge for a specific user with adaptive difficulty
   */
  async getTodaysChallengeForUser(userId: number): Promise<Challenge | null> {
    const today = startOfDay(new Date());
    
    // Check if user already has a challenge selected for today
    const existingSelection = await challengeRepository.getTodaysChallengeSelection(userId);
    
    if (existingSelection) {
      return await challengeRepository.getChallengeById(existingSelection.selected_challenge_id);
    }
    
    // Use adaptive challenge service to select a new challenge
    const challenge = await adaptiveChallengeService.getNextChallengeForUser(userId);
    
    // Note: The adaptive service already records the selection
    return challenge;
  }

  /**
   * Submit a challenge answer
   */
  async submitChallenge(
    userId: number, 
    challengeId: number, 
    answer: any, 
    timeSpentSeconds: number
  ): Promise<{
    isCorrect: boolean;
    feedback: string;
    xpEarned: number;
    streakInfo: {
      currentStreak: number;
      streakMaintained: boolean;
      isNewRecord: boolean;
    };
  }> {
    const challenge = await challengeRepository.getChallengeById(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    // Check the answer
    const isCorrect = await challengeAnswerService.checkAnswer(challenge, answer);
    
    // Calculate XP based on difficulty and time
    const xpEarned = xpService.calculateXP(challenge, isCorrect, timeSpentSeconds);
    
    // Generate feedback
    const feedback = challengeAnswerService.generateFeedback(challenge, answer, isCorrect);
    
    // Record submission
    await db('challenge_submissions').insert({
      user_id: userId,
      challenge_id: challengeId,
      started_at: new Date(Date.now() - timeSpentSeconds * 1000),
      completed_at: new Date(),
      answer: JSON.stringify(answer),
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds,
      xp_earned: xpEarned,
      feedback: feedback,
      created_at: new Date()
    });
    
    // Update user stats
    await challengeStatsService.updateStats(userId, challengeId, isCorrect);
    
    // Update user stats and streak
    const streakInfo = await streakService.updateUserStreak(userId);
    
    // Award XP
    await xpService.awardXP(userId, xpEarned, `Challenge ${challengeId} completion`);
    
    // Check for achievements
    await xpService.checkAndAwardAchievements(userId);
    
    return {
      isCorrect,
      feedback,
      xpEarned,
      streakInfo
    };
  }

  /**
   * Get user's challenge statistics
   */
  async getUserChallengeStats(userId: number): Promise<UserChallengeStats> {
    return await challengeStatsService.getUserChallengeStats(userId);
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'allTime' = 'weekly'): Promise<any[]> {
    return await leaderboardService.getLeaderboard(timeframe);
  }

  /**
   * Get user's challenge history
   */
  async getUserChallengeHistory(userId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    return await challengeStatsService.getUserChallengeHistory(userId, limit, offset);
  }
}

export default new ChallengeService(); 