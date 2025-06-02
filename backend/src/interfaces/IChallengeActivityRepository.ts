import { ChallengeActivity } from '../types/api-contracts';

/**
 * Interface for Challenge Activity Repository
 * Follows Interface Segregation Principle - focused on activity retrieval
 */
export interface IChallengeActivityRepository {
  /**
   * Get recent activities for a user
   * @param userId User ID
   * @param limit Maximum number of activities to return
   * @returns Array of recent challenge activities
   */
  getRecentActivities(userId: number, limit: number): Promise<ChallengeActivity[]>;
  
  /**
   * Get activities within a date range
   * @param userId User ID
   * @param start Start date
   * @param end End date
   * @returns Array of challenge activities
   */
  getActivitiesByDateRange(userId: number, start: Date, end: Date): Promise<ChallengeActivity[]>;
  
  /**
   * Get activity count for a user
   * @param userId User ID
   * @param days Number of days to look back (optional)
   * @returns Activity count
   */
  getActivityCount(userId: number, days?: number): Promise<number>;
} 