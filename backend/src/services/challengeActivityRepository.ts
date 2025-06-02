import { Knex } from 'knex';
import { IChallengeActivityRepository } from '../interfaces/IChallengeActivityRepository';
import { ChallengeActivity } from '../types/api-contracts';
import { subDays } from 'date-fns';
import logger from '../utils/logger';

/**
 * Repository for retrieving challenge activity data
 * Implements Repository pattern for data access
 */
export class ChallengeActivityRepository implements IChallengeActivityRepository {
  constructor(private db: Knex) {}

  /**
   * Get recent activities for a user
   */
  async getRecentActivities(userId: number, limit: number = 10): Promise<ChallengeActivity[]> {
    try {
      const activities = await this.db('challenge_submissions as cs')
        .join('challenges as c', 'cs.challenge_id', 'c.id')
        .where('cs.user_id', userId)
        .select(
          'cs.challenge_id as challengeId',
          'c.type as type',
          'cs.is_correct as isCorrect',
          'cs.completed_at as completedAt'
        )
        .orderBy('cs.completed_at', 'desc')
        .limit(limit);
      
      return activities.map(this.transformActivity);
    } catch (error) {
      logger.error('Error fetching recent activities:', error);
      return [];
    }
  }
  
  /**
   * Get activities within a date range
   */
  async getActivitiesByDateRange(userId: number, start: Date, end: Date): Promise<ChallengeActivity[]> {
    try {
      const activities = await this.db('challenge_submissions as cs')
        .join('challenges as c', 'cs.challenge_id', 'c.id')
        .where('cs.user_id', userId)
        .whereBetween('cs.completed_at', [start, end])
        .select(
          'cs.challenge_id as challengeId',
          'c.type as type',
          'cs.is_correct as isCorrect',
          'cs.completed_at as completedAt'
        )
        .orderBy('cs.completed_at', 'desc');
      
      return activities.map(this.transformActivity);
    } catch (error) {
      logger.error('Error fetching activities by date range:', error);
      return [];
    }
  }
  
  /**
   * Get activity count for a user
   */
  async getActivityCount(userId: number, days?: number): Promise<number> {
    try {
      let query = this.db('challenge_submissions')
        .where('user_id', userId)
        .count('* as count');
      
      if (days) {
        const startDate = subDays(new Date(), days);
        query = query.where('completed_at', '>=', startDate);
      }
      
      const result = await query.first();
      return parseInt(result?.count as string) || 0;
    } catch (error) {
      logger.error('Error fetching activity count:', error);
      return 0;
    }
  }
  
  /**
   * Transform database activity to API format
   */
  private transformActivity(dbActivity: any): ChallengeActivity {
    return {
      challengeId: dbActivity.challengeId,
      type: dbActivity.type,
      isCorrect: Boolean(dbActivity.isCorrect),
      completedAt: dbActivity.completedAt.toISOString()
    };
  }
}

/**
 * Factory function for dependency injection
 */
export function createChallengeActivityRepository(db: Knex): IChallengeActivityRepository {
  return new ChallengeActivityRepository(db);
} 