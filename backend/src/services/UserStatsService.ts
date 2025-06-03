import db from '../db';
import logger from '../utils/logger';

/**
 * UserStatsService - Single Responsibility for User Statistics
 * 
 * CRITICAL FIX: Implements missing totalXpEarned and recentActivity calculations
 * that were causing API mismatch issues with iOS app.
 * 
 * Architecture: 
 * - SRP: Only handles user statistics calculations
 * - OCP: Extensible for new stat types
 * - DIP: Depends on database abstraction
 */

export interface UserStats {
  totalChallengesCompleted: number;
  totalCorrect: number;
  currentStreak: number;
  longestStreak: number;
  totalXpEarned: number;
  averageAccuracy: number;
  recentActivity: RecentActivity[];
  streakInfo: StreakInfo;
}

export interface RecentActivity {
  id: number;
  type: 'challenge_completed' | 'streak_milestone' | 'xp_earned' | 'achievement_unlocked';
  title: string;
  description: string;
  xpEarned?: number;
  timestamp: Date;
  metadata?: any;
}

export interface StreakInfo {
  current: number;
  longest: number;
  isActive: boolean;
  lastActivityDate?: Date;
}

export class UserStatsService {
  /**
   * Get comprehensive user statistics
   * CRITICAL FIX: Properly calculates totalXpEarned from challenge_submissions
   */
  static async getUserStats(userId: number): Promise<UserStats> {
    try {
      logger.debug(`Calculating stats for user ${userId}`);
      
      // Get base stats from user_challenge_stats table
      const baseStats = await this.getBaseStats(userId);
      
      // Calculate total XP earned (CRITICAL FIX)
      const totalXpEarned = await this.calculateTotalXpEarned(userId);
      
      // Get recent activity (CRITICAL FIX)
      const recentActivity = await this.getRecentActivity(userId, 10);
      
      // Get streak information
      const streakInfo = await this.getStreakInfo(userId);
      
      // Calculate average accuracy
      const averageAccuracy = baseStats.totalChallengesCompleted > 0 
        ? (baseStats.totalCorrect / baseStats.totalChallengesCompleted) * 100 
        : 0;
      
      const stats: UserStats = {
        totalChallengesCompleted: baseStats.totalChallengesCompleted,
        totalCorrect: baseStats.totalCorrect,
        currentStreak: baseStats.currentStreak,
        longestStreak: baseStats.longestStreak,
        totalXpEarned,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100, // Round to 2 decimal places
        recentActivity,
        streakInfo
      };
      
      logger.debug(`Stats calculated for user ${userId}:`, {
        challenges: stats.totalChallengesCompleted,
        xp: stats.totalXpEarned,
        streak: stats.currentStreak,
        activities: stats.recentActivity.length
      });
      
      return stats;
    } catch (error) {
      logger.error(`Failed to get user stats for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * CRITICAL FIX: Calculate total XP earned from challenge submissions
   * Previously this was hardcoded to 0, causing API contract violations
   */
  private static async calculateTotalXpEarned(userId: number): Promise<number> {
    try {
      // Try to get from user_challenge_stats first (after migration)
      const statsRecord = await db('user_challenge_stats')
        .where('user_id', userId)
        .select('total_xp_earned')
        .first();
      
      if (statsRecord && statsRecord.total_xp_earned !== null) {
        return statsRecord.total_xp_earned;
      }
      
      // Fallback: Calculate from challenge_submissions
      const result = await db('challenge_submissions')
        .where('user_id', userId)
        .sum('xp_earned as total');
      
      const totalXp = result[0]?.total || 0;
      
      // Update the stats table if it exists
      if (statsRecord) {
        await db('user_challenge_stats')
          .where('user_id', userId)
          .update('total_xp_earned', totalXp);
      }
      
      return parseInt(totalXp.toString(), 10);
    } catch (error) {
      logger.error(`Failed to calculate total XP for user ${userId}:`, error);
      return 0; // Graceful fallback
    }
  }
  
  /**
   * CRITICAL FIX: Implement recentActivity functionality
   * Previously returned empty array, causing iOS UI issues
   */
  private static async getRecentActivity(userId: number, limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];
      
      // Get recent challenge completions
      const recentChallenges = await db('challenge_submissions as cs')
        .join('challenges as c', 'cs.challenge_id', 'c.id')
        .where('cs.user_id', userId)
        .where('cs.completed_at', '!=', null)
        .select(
          'cs.id',
          'cs.completed_at',
          'cs.is_correct',
          'cs.xp_earned',
          'c.title as challenge_title',
          'c.type as challenge_type'
        )
        .orderBy('cs.completed_at', 'desc')
        .limit(limit);
      
      // Transform challenge submissions to activities
      for (const challenge of recentChallenges) {
        const activity: RecentActivity = {
          id: challenge.id,
          type: 'challenge_completed',
          title: challenge.is_correct ? 'Challenge Completed!' : 'Challenge Attempted',
          description: `${challenge.challenge_title} - ${challenge.is_correct ? 'Correct' : 'Incorrect'}`,
          xpEarned: challenge.xp_earned,
          timestamp: new Date(challenge.completed_at),
          metadata: {
            challengeType: challenge.challenge_type,
            isCorrect: challenge.is_correct
          }
        };
        activities.push(activity);
      }
      
      // Get streak milestones (if we have streak history)
      const streakMilestones = await this.getStreakMilestones(userId, limit);
      activities.push(...streakMilestones);
      
      // Sort all activities by timestamp and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
      
    } catch (error) {
      logger.error(`Failed to get recent activity for user ${userId}:`, error);
      return []; // Graceful fallback with empty array
    }
  }
  
  /**
   * Get streak information for user
   */
  private static async getStreakInfo(userId: number): Promise<StreakInfo> {
    try {
      const stats = await db('user_challenge_stats')
        .where('user_id', userId)
        .select('current_streak', 'longest_streak', 'last_challenge_date')
        .first();
      
      if (!stats) {
        return {
          current: 0,
          longest: 0,
          isActive: false
        };
      }
      
      // Check if streak is still active (completed challenge within last 48 hours)
      const lastActivityDate = stats.last_challenge_date ? new Date(stats.last_challenge_date) : null;
      const isActive = lastActivityDate ? 
        (Date.now() - lastActivityDate.getTime()) < (48 * 60 * 60 * 1000) : false;
      
      return {
        current: stats.current_streak || 0,
        longest: stats.longest_streak || 0,
        isActive,
        lastActivityDate
      };
    } catch (error) {
      logger.error(`Failed to get streak info for user ${userId}:`, error);
      return {
        current: 0,
        longest: 0,
        isActive: false
      };
    }
  }
  
  /**
   * Get base statistics from user_challenge_stats table
   */
  private static async getBaseStats(userId: number): Promise<{
    totalChallengesCompleted: number;
    totalCorrect: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    try {
      const stats = await db('user_challenge_stats')
        .where('user_id', userId)
        .select('total_completed', 'total_correct', 'current_streak', 'longest_streak')
        .first();
      
      if (!stats) {
        // Create initial stats record if it doesn't exist
        await db('user_challenge_stats').insert({
          user_id: userId,
          total_completed: 0,
          total_correct: 0,
          current_streak: 0,
          longest_streak: 0,
          total_xp_earned: 0,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        return {
          totalChallengesCompleted: 0,
          totalCorrect: 0,
          currentStreak: 0,
          longestStreak: 0
        };
      }
      
      return {
        totalChallengesCompleted: stats.total_completed || 0,
        totalCorrect: stats.total_correct || 0,
        currentStreak: stats.current_streak || 0,
        longestStreak: stats.longest_streak || 0
      };
    } catch (error) {
      logger.error(`Failed to get base stats for user ${userId}:`, error);
      return {
        totalChallengesCompleted: 0,
        totalCorrect: 0,
        currentStreak: 0,
        longestStreak: 0
      };
    }
  }
  
  /**
   * Get streak milestone activities
   */
  private static async getStreakMilestones(userId: number, limit: number): Promise<RecentActivity[]> {
    try {
      // This would be enhanced with a proper streak_milestones table
      // For now, generate milestone activities based on current streak
      const streakInfo = await this.getStreakInfo(userId);
      const activities: RecentActivity[] = [];
      
      // Generate milestone activities for significant streaks
      if (streakInfo.current >= 7) {
        activities.push({
          id: Date.now(), // Temporary ID
          type: 'streak_milestone',
          title: 'Week Streak!',
          description: `You've maintained a ${streakInfo.current}-day streak!`,
          xpEarned: 50,
          timestamp: new Date(),
          metadata: { streakLength: streakInfo.current }
        });
      }
      
      return activities.slice(0, limit);
    } catch (error) {
      logger.error(`Failed to get streak milestones for user ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Update user statistics after challenge completion
   */
  static async updateStatsAfterChallenge(
    userId: number, 
    challengeId: number, 
    isCorrect: boolean, 
    xpEarned: number
  ): Promise<void> {
    try {
      await db.transaction(async (trx) => {
        // Get current stats
        let stats = await trx('user_challenge_stats')
          .where('user_id', userId)
          .first();
        
        if (!stats) {
          // Create new stats record
          await trx('user_challenge_stats').insert({
            user_id: userId,
            total_completed: 1,
            total_correct: isCorrect ? 1 : 0,
            current_streak: isCorrect ? 1 : 0,
            longest_streak: isCorrect ? 1 : 0,
            total_xp_earned: xpEarned,
            last_challenge_date: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          });
        } else {
          // Update existing stats
          const newStreak = isCorrect ? stats.current_streak + 1 : 0;
          const newLongestStreak = Math.max(stats.longest_streak, newStreak);
          
          await trx('user_challenge_stats')
            .where('user_id', userId)
            .update({
              total_completed: stats.total_completed + 1,
              total_correct: stats.total_correct + (isCorrect ? 1 : 0),
              current_streak: newStreak,
              longest_streak: newLongestStreak,
              total_xp_earned: (stats.total_xp_earned || 0) + xpEarned,
              last_challenge_date: new Date(),
              updated_at: new Date()
            });
        }
      });
      
      logger.debug(`Updated stats for user ${userId} after challenge ${challengeId}`);
    } catch (error) {
      logger.error(`Failed to update stats for user ${userId}:`, error);
      throw error;
    }
  }
} 