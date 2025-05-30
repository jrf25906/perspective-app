/**
 * Interface for Streak Service
 * Manages user activity streaks
 */
export interface IStreakService {
  /**
   * Update user's streak based on activity
   */
  updateUserStreak(userId: number): Promise<{
    currentStreak: number;
    streakMaintained: boolean;
    isNewRecord: boolean;
  }>;

  /**
   * Get user's current streak information
   */
  getUserStreakInfo(userId: number): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date;
  }>;

  /**
   * Check if user has been active today
   */
  hasUserBeenActiveToday(userId: number): Promise<boolean>;
} 