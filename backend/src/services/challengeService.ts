import { Knex } from 'knex';
import { 
  Challenge, 
  ChallengeType, 
  DifficultyLevel, 
  ChallengeSubmission, 
  UserChallengeStats,
  DailyChallengeSelection
} from '../models/Challenge';
import { startOfDay } from 'date-fns';
import { IChallengeService } from '../interfaces/IChallengeService';
import { IAdaptiveChallengeService } from '../interfaces/IAdaptiveChallengeService';
import { IChallengeRepository } from '../interfaces/IChallengeRepository';
import { IXPService } from '../interfaces/IXPService';
import { IStreakService } from '../interfaces/IStreakService';
import { ILeaderboardService } from '../interfaces/ILeaderboardService';
import { IChallengeStatsService } from '../interfaces/IChallengeStatsService';
import { IChallengeAnswerService } from '../interfaces/IChallengeAnswerService';

export class ChallengeService implements IChallengeService {
  constructor(
    private db: Knex,
    private adaptiveChallengeService: IAdaptiveChallengeService,
    private challengeRepository: IChallengeRepository,
    private challengeAnswerService: IChallengeAnswerService,
    private xpService: IXPService,
    private streakService: IStreakService,
    private leaderboardService: ILeaderboardService,
    private challengeStatsService: IChallengeStatsService
  ) {}

  /**
   * Get all active challenges from the database
   */
  async getAllChallenges(filters?: {
    type?: ChallengeType;
    difficulty?: DifficultyLevel;
    isActive?: boolean;
  }): Promise<Challenge[]> {
    return await this.challengeRepository.getAllChallenges(filters);
  }

  /**
   * Get a specific challenge by ID
   */
  async getChallengeById(challengeId: number): Promise<Challenge | null> {
    return await this.challengeRepository.getChallengeById(challengeId);
  }

  /**
   * Get today's challenge for a specific user with adaptive difficulty
   */
  async getTodaysChallengeForUser(userId: number): Promise<Challenge | null> {
    const today = startOfDay(new Date());
    
    // Check if user already has a challenge selected for today
    const existingSelection = await this.challengeRepository.getTodaysChallengeSelection(userId);
    
    if (existingSelection) {
      return await this.challengeRepository.getChallengeById(existingSelection.selected_challenge_id);
    }
    
    // Use adaptive challenge service to select a new challenge
    const challenge = await this.adaptiveChallengeService.getNextChallengeForUser(userId);
    
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
    const challenge = await this.challengeRepository.getChallengeById(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    // Check the answer
    const isCorrect = await this.challengeAnswerService.checkAnswer(challenge, answer);
    
    // Calculate XP based on difficulty and time
    const xpEarned = this.xpService.calculateXP(challenge, isCorrect, timeSpentSeconds);
    
    // Generate feedback
    const feedback = this.challengeAnswerService.generateFeedback(challenge, answer, isCorrect);
    
    // Record submission
    await this.db('challenge_submissions').insert({
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
    await this.challengeStatsService.updateStats(userId, challengeId, isCorrect);
    
    // Update user stats and streak
    const streakInfo = await this.streakService.updateUserStreak(userId);
    
    // Award XP
    await this.xpService.awardXP(userId, xpEarned, `Challenge ${challengeId} completion`);
    
    // Check for achievements
    await this.xpService.checkAndAwardAchievements(userId);
    
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
    return await this.challengeStatsService.getUserChallengeStats(userId);
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'allTime' = 'weekly'): Promise<any[]> {
    return await this.leaderboardService.getLeaderboard(timeframe);
  }

  /**
   * Get user's challenge history
   */
  async getUserChallengeHistory(userId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    return await this.challengeStatsService.getUserChallengeHistory(userId, limit, offset);
  }
}

// Export a factory function instead of a singleton
export function createChallengeService(
  db: Knex,
  adaptiveChallengeService: IAdaptiveChallengeService,
  challengeRepository: IChallengeRepository,
  challengeAnswerService: IChallengeAnswerService,
  xpService: IXPService,
  streakService: IStreakService,
  leaderboardService: ILeaderboardService,
  challengeStatsService: IChallengeStatsService
): IChallengeService {
  return new ChallengeService(
    db,
    adaptiveChallengeService,
    challengeRepository,
    challengeAnswerService,
    xpService,
    streakService,
    leaderboardService,
    challengeStatsService
  );
}

// Keep default export for backward compatibility, but mark as deprecated
/** @deprecated Use dependency injection instead */
export default new ChallengeService(
  require('../db').default,
  require('./adaptiveChallengeService').default,
  require('./challengeRepository').default,
  require('./challengeAnswerService').default,
  require('./xpService').default,
  require('./streakService').default,
  require('./leaderboardService').default,
  require('./challengeStatsService').default
); 