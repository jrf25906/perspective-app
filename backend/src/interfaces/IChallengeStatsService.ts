import { UserChallengeStats } from '../models/Challenge';

/**
 * Interface for Challenge Stats Service
 * Manages user challenge statistics and history
 */
export interface IChallengeStatsService {
  /**
   * Update user statistics after a challenge submission
   */
  updateStats(userId: number, challengeId: number, isCorrect: boolean): Promise<void>;
  
  /**
   * Get comprehensive challenge statistics for a user
   */
  getUserChallengeStats(userId: number): Promise<UserChallengeStats>;
  
  /**
   * Get paginated challenge history for a user
   */
  getUserChallengeHistory(userId: number, limit: number, offset: number): Promise<any[]>;
} 