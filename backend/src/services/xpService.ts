import { Challenge } from '../models/Challenge';
import db from '../db';

export class XPService {
  /**
   * Calculate XP reward based on challenge difficulty and performance
   */
  calculateXP(challenge: Challenge, isCorrect: boolean, timeSpentSeconds: number): number {
    let xp = challenge.xp_reward;
    
    if (!isCorrect) {
      // Partial credit for attempt
      xp = Math.floor(xp * 0.3);
    } else {
      // Bonus for quick completion
      const expectedTime = challenge.estimated_time_minutes * 60;
      if (timeSpentSeconds < expectedTime * 0.5) {
        xp = Math.floor(xp * 1.2); // 20% bonus
      }
    }
    
    return xp;
  }

  /**
   * Award XP to user
   */
  async awardXP(userId: number, xpAmount: number, reason: string): Promise<void> {
    await db.transaction(async (trx) => {
      // Update user's XP
      await trx('users')
        .where('id', userId)
        .increment('echo_score', xpAmount);
      
      // Record XP transaction
      await trx('xp_transactions').insert({
        user_id: userId,
        amount: xpAmount,
        reason: reason,
        created_at: new Date()
      });
    });
  }

  /**
   * Get user's XP history
   */
  async getXPHistory(userId: number, limit: number = 50): Promise<any[]> {
    return await db('xp_transactions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  /**
   * Calculate streak bonus XP
   */
  calculateStreakBonus(currentStreak: number): number {
    // Progressive bonus based on streak length
    if (currentStreak >= 30) return 100;
    if (currentStreak >= 14) return 50;
    if (currentStreak >= 7) return 25;
    if (currentStreak >= 3) return 10;
    return 0;
  }

  /**
   * Calculate level from total XP
   */
  calculateLevel(totalXP: number): {
    level: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
  } {
    // Level progression formula: XP required = 100 * level^1.5
    let level = 1;
    let xpRequired = 0;
    let previousLevelXP = 0;
    
    while (xpRequired <= totalXP) {
      level++;
      previousLevelXP = xpRequired;
      xpRequired = Math.floor(100 * Math.pow(level, 1.5));
    }
    
    level--; // Step back to current level
    const currentLevelXP = totalXP - previousLevelXP;
    const nextLevelXP = Math.floor(100 * Math.pow(level + 1, 1.5)) - previousLevelXP;
    const progress = currentLevelXP / nextLevelXP;
    
    return {
      level,
      currentLevelXP,
      nextLevelXP,
      progress
    };
  }

  /**
   * Get user's current XP and level
   */
  async getUserXPInfo(userId: number): Promise<{
    totalXP: number;
    level: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
  }> {
    const user = await db('users')
      .where('id', userId)
      .select('echo_score')
      .first();
    
    const totalXP = user?.echo_score || 0;
    const levelInfo = this.calculateLevel(totalXP);
    
    return {
      totalXP,
      ...levelInfo
    };
  }

  /**
   * Check and award achievement bonuses
   */
  async checkAndAwardAchievements(userId: number): Promise<{
    newAchievements: string[];
    xpAwarded: number;
  }> {
    // This would check various achievement conditions
    // For now, a simplified version
    const newAchievements: string[] = [];
    let xpAwarded = 0;
    
    const stats = await db('user_challenge_stats')
      .where('user_id', userId)
      .first();
    
    if (stats) {
      // First challenge achievement
      if (stats.total_completed === 1) {
        newAchievements.push('first_challenge');
        xpAwarded += 50;
      }
      
      // Perfect week achievement (7 challenges in 7 days)
      if (stats.current_streak === 7) {
        newAchievements.push('perfect_week');
        xpAwarded += 100;
      }
      
      // Add more achievement checks here...
    }
    
    if (xpAwarded > 0) {
      await this.awardXP(userId, xpAwarded, 'achievements');
    }
    
    return { newAchievements, xpAwarded };
  }
}

export default new XPService(); 