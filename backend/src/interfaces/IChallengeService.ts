import { 
  Challenge, 
  ChallengeType, 
  DifficultyLevel, 
  UserChallengeStats
} from '../models/Challenge';

/**
 * Interface for Challenge Service
 * Defines methods for managing challenges and user interactions
 */
export interface IChallengeService {
  /**
   * Get all active challenges from the database
   */
  getAllChallenges(filters?: {
    type?: ChallengeType;
    difficulty?: DifficultyLevel;
    isActive?: boolean;
  }): Promise<Challenge[]>;

  /**
   * Get a specific challenge by ID
   */
  getChallengeById(challengeId: number): Promise<Challenge | null>;

  /**
   * Get today's challenge for a specific user with adaptive difficulty
   */
  getTodaysChallengeForUser(userId: number): Promise<Challenge | null>;

  /**
   * Submit a challenge answer
   */
  submitChallenge(
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
  }>;

  /**
   * Get user's challenge statistics
   */
  getUserChallengeStats(userId: number): Promise<UserChallengeStats>;

  /**
   * Get leaderboard data
   */
  getLeaderboard(timeframe: 'daily' | 'weekly' | 'allTime'): Promise<any[]>;

  /**
   * Get user's challenge history
   */
  getUserChallengeHistory(userId: number, limit: number, offset: number): Promise<any[]>;
} 