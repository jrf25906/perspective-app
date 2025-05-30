import db from '../db';
import { isYesterday, isToday, differenceInDays } from 'date-fns';
import { UserChallengeStats } from '../models/Challenge';

export class StreakService {
  /**
   * Update user's streak information
   */
  async updateUserStreak(userId: number): Promise<{
    currentStreak: number;
    streakMaintained: boolean;
    isNewRecord: boolean;
  }> {
    const user = await db('users').where('id', userId).first();
    const lastSubmission = await this.getLastSubmission(userId);
    
    let currentStreak = user.current_streak || 0;
    let streakMaintained = false;
    let isNewRecord = false;
    
    if (!lastSubmission) {
      // First challenge
      currentStreak = 1;
      streakMaintained = true;
    } else {
      const lastDate = new Date(lastSubmission.created_at);
      const today = new Date();
      
      if (isYesterday(lastDate)) {
        // Continuing streak
        currentStreak += 1;
        streakMaintained = true;
      } else if (isToday(lastDate)) {
        // Already completed today, maintain streak
        streakMaintained = true;
      } else {
        // Streak broken
        currentStreak = 1;
        streakMaintained = false;
      }
    }
    
    // Check if it's a new record
    const stats = await this.getUserChallengeStats(userId);
    if (currentStreak > (stats.longest_streak || 0)) {
      isNewRecord = true;
      await this.updateLongestStreak(userId, currentStreak);
    }
    
    // Update user's current streak
    await db('users')
      .where('id', userId)
      .update({ 
        current_streak: currentStreak,
        last_activity_date: new Date()
      });
    
    return {
      currentStreak,
      streakMaintained,
      isNewRecord
    };
  }

  /**
   * Get the last submission for a user (excluding the most recent)
   */
  private async getLastSubmission(userId: number): Promise<any> {
    return await db('challenge_submissions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .offset(1) // Skip the one we just created
      .first();
  }

  /**
   * Get user's challenge statistics
   */
  private async getUserChallengeStats(userId: number): Promise<UserChallengeStats> {
    let stats = await db('user_challenge_stats')
      .where('user_id', userId)
      .first();
    
    if (!stats) {
      // Create initial stats
      stats = {
        user_id: userId,
        total_completed: 0,
        total_correct: 0,
        current_streak: 0,
        longest_streak: 0,
        difficulty_performance: {},
        type_performance: {}
      };
      
      await db('user_challenge_stats').insert(stats);
    }
    
    return stats;
  }

  /**
   * Update longest streak record
   */
  private async updateLongestStreak(userId: number, newLongestStreak: number): Promise<void> {
    await db('user_challenge_stats')
      .where('user_id', userId)
      .update({ longest_streak: newLongestStreak });
  }

  /**
   * Get streak information for multiple users
   */
  async getMultipleUserStreaks(userIds: number[]): Promise<Map<number, {
    currentStreak: number;
    longestStreak: number;
  }>> {
    const users = await db('users')
      .whereIn('id', userIds)
      .select('id', 'current_streak');
    
    const stats = await db('user_challenge_stats')
      .whereIn('user_id', userIds)
      .select('user_id', 'longest_streak');
    
    const statsMap = new Map(stats.map(s => [s.user_id, s.longest_streak]));
    const resultMap = new Map<number, { currentStreak: number; longestStreak: number }>();
    
    users.forEach(user => {
      resultMap.set(user.id, {
        currentStreak: user.current_streak || 0,
        longestStreak: statsMap.get(user.id) || 0
      });
    });
    
    return resultMap;
  }

  /**
   * Check if user is at risk of losing streak
   */
  async isStreakAtRisk(userId: number): Promise<boolean> {
    const lastSubmission = await db('challenge_submissions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .first();
    
    if (!lastSubmission) return false;
    
    const lastDate = new Date(lastSubmission.created_at);
    const now = new Date();
    const hoursSinceLastSubmission = differenceInDays(now, lastDate) * 24 + 
      (now.getHours() - lastDate.getHours());
    
    // Streak at risk if more than 20 hours since last submission
    return hoursSinceLastSubmission > 20;
  }

  /**
   * Get users with expiring streaks (for notifications)
   */
  async getUsersWithExpiringStreaks(): Promise<number[]> {
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);
    
    const users = await db('users as u')
      .join('challenge_submissions as cs', function() {
        this.on('u.id', '=', 'cs.user_id')
          .andOn('cs.created_at', '=', db.raw('(SELECT MAX(created_at) FROM challenge_submissions WHERE user_id = u.id)'));
      })
      .where('u.current_streak', '>', 0)
      .where('cs.created_at', '<', twentyHoursAgo)
      .where('cs.created_at', '>', new Date(Date.now() - 48 * 60 * 60 * 1000))
      .select('u.id');
    
    return users.map(u => u.id);
  }

  /**
   * Reset expired streaks
   */
  async resetExpiredStreaks(): Promise<number> {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const result = await db('users')
      .where('current_streak', '>', 0)
      .where('last_activity_date', '<', twoDaysAgo)
      .update({ current_streak: 0 });
    
    return result;
  }

  /**
   * Get user's current streak information
   */
  async getUserStreakInfo(userId: number): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date;
  }> {
    const user = await db('users')
      .where('id', userId)
      .select('current_streak', 'last_activity_date')
      .first();
    
    const stats = await db('user_challenge_stats')
      .where('user_id', userId)
      .select('longest_streak')
      .first();
    
    return {
      currentStreak: user?.current_streak || 0,
      longestStreak: stats?.longest_streak || 0,
      lastActiveDate: user?.last_activity_date || new Date()
    };
  }

  /**
   * Check if user has been active today
   */
  async hasUserBeenActiveToday(userId: number): Promise<boolean> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const submission = await db('challenge_submissions')
      .where('user_id', userId)
      .where('created_at', '>=', todayStart)
      .first();
    
    return !!submission;
  }
}

export default new StreakService(); 