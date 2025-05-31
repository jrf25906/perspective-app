import db from '../db';
import { 
  ChallengeType, 
  DifficultyLevel, 
  UserChallengeStats,
  ChallengeSubmission
} from '../models/Challenge';
import { addDays } from 'date-fns';

export class ChallengeStatsService {
  /**
   * Get or create user's challenge statistics
   */
  async getUserChallengeStats(userId: number): Promise<UserChallengeStats> {
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
   * Update user statistics after challenge submission
   */
  async updateStats(userId: number, challengeId: number, isCorrect: boolean): Promise<void> {
    await db.transaction(async (trx) => {
      // Get challenge details
      const challenge = await trx('challenges')
        .where('id', challengeId)
        .first();
      
      if (!challenge) return;
      
      // Update basic counts
      await trx('user_challenge_stats')
        .where('user_id', userId)
        .increment('total_completed', 1);
      
      if (isCorrect) {
        await trx('user_challenge_stats')
          .where('user_id', userId)
          .increment('total_correct', 1);
      }
      
      // Update performance by type and difficulty
      const stats = await trx('user_challenge_stats')
        .where('user_id', userId)
        .first();
      
      const diffPerf = stats.difficulty_performance || {};
      const typePerf = stats.type_performance || {};
      
      // Update difficulty performance
      if (!diffPerf[challenge.difficulty]) {
        diffPerf[challenge.difficulty] = { completed: 0, correct: 0 };
      }
      diffPerf[challenge.difficulty].completed++;
      if (isCorrect) {
        diffPerf[challenge.difficulty].correct++;
      }
      
      // Update type performance
      if (!typePerf[challenge.type]) {
        typePerf[challenge.type] = { completed: 0, correct: 0 };
      }
      typePerf[challenge.type].completed++;
      if (isCorrect) {
        typePerf[challenge.type].correct++;
      }
      
      await trx('user_challenge_stats')
        .where('user_id', userId)
        .update({
          difficulty_performance: JSON.stringify(diffPerf),
          type_performance: JSON.stringify(typePerf)
        });
    });
  }

  /**
   * Get detailed performance metrics
   */
  async getDetailedStats(userId: number): Promise<{
    overall: {
      totalCompleted: number;
      totalCorrect: number;
      accuracy: number;
      averageTimeSeconds: number;
    };
    byDifficulty: Record<DifficultyLevel, {
      completed: number;
      correct: number;
      accuracy: number;
      averageTimeSeconds: number;
    }>;
    byType: Record<ChallengeType, {
      completed: number;
      correct: number;
      accuracy: number;
      averageTimeSeconds: number;
    }>;
  }> {
    const stats = await this.getUserChallengeStats(userId);
    const submissions = await this.getRecentSubmissions(userId, 365); // Last year
    
    // Calculate overall metrics
    const overall = {
      totalCompleted: stats.total_completed,
      totalCorrect: stats.total_correct,
      accuracy: stats.total_completed > 0 
        ? Math.round((stats.total_correct / stats.total_completed) * 100) 
        : 0,
      averageTimeSeconds: submissions.length > 0
        ? Math.round(submissions.reduce((sum, s) => sum + s.time_spent_seconds, 0) / submissions.length)
        : 0
    };
    
    // Calculate by difficulty
    const byDifficulty: any = {};
    for (const level of Object.values(DifficultyLevel)) {
      const levelSubs = submissions.filter(s => s.difficulty === level);
      const perf = stats.difficulty_performance?.[level] || { completed: 0, correct: 0 };
      
      byDifficulty[level] = {
        completed: perf.completed,
        correct: perf.correct,
        accuracy: perf.completed > 0 
          ? Math.round((perf.correct / perf.completed) * 100) 
          : 0,
        averageTimeSeconds: levelSubs.length > 0
          ? Math.round(levelSubs.reduce((sum, s) => sum + s.time_spent_seconds, 0) / levelSubs.length)
          : 0
      };
    }
    
    // Calculate by type
    const byType: any = {};
    for (const type of Object.values(ChallengeType)) {
      const typeSubs = submissions.filter(s => s.type === type);
      const perf = stats.type_performance?.[type] || { completed: 0, correct: 0 };
      
      byType[type] = {
        completed: perf.completed,
        correct: perf.correct,
        accuracy: perf.completed > 0 
          ? Math.round((perf.correct / perf.completed) * 100) 
          : 0,
        averageTimeSeconds: typeSubs.length > 0
          ? Math.round(typeSubs.reduce((sum, s) => sum + s.time_spent_seconds, 0) / typeSubs.length)
          : 0
      };
    }
    
    return { overall, byDifficulty, byType };
  }

  /**
   * Get recent submissions for a user
   */
  async getRecentSubmissions(userId: number, days: number): Promise<any[]> {
    const since = addDays(new Date(), -days);
    
    return await db('challenge_submissions as cs')
      .join('challenges as c', 'cs.challenge_id', 'c.id')
      .where('cs.user_id', userId)
      .where('cs.created_at', '>=', since)
      .select('cs.*', 'c.type', 'c.difficulty')
      .orderBy('cs.created_at', 'desc');
  }

  /**
   * Find the weakest challenge type for a user
   */
  findWeakestChallengeType(stats: UserChallengeStats): ChallengeType | null {
    let weakestType: ChallengeType | null = null;
    let lowestSuccessRate = 1;
    
    for (const [type, performance] of Object.entries(stats.type_performance || {})) {
      if (performance.completed > 0) {
        const successRate = performance.correct / performance.completed;
        if (successRate < lowestSuccessRate) {
          lowestSuccessRate = successRate;
          weakestType = type as ChallengeType;
        }
      }
    }
    
    return lowestSuccessRate < 0.6 ? weakestType : null;
  }

  /**
   * Get progress towards next achievement
   */
  async getAchievementProgress(userId: number): Promise<{
    nextAchievements: Array<{
      name: string;
      description: string;
      progress: number;
      target: number;
    }>;
  }> {
    const stats = await this.getUserChallengeStats(userId);
    const nextAchievements = [];
    
    // 10 challenges achievement
    if (stats.total_completed < 10) {
      nextAchievements.push({
        name: 'Getting Started',
        description: 'Complete 10 challenges',
        progress: stats.total_completed,
        target: 10
      });
    }
    
    // Perfect accuracy achievement
    const recentSubmissions = await this.getRecentSubmissions(userId, 7);
    const recentCorrect = recentSubmissions.filter(s => s.is_correct).length;
    if (recentSubmissions.length >= 5 && recentCorrect < recentSubmissions.length) {
      nextAchievements.push({
        name: 'Perfect Week',
        description: 'Get 5 challenges correct in a row',
        progress: recentCorrect,
        target: 5
      });
    }
    
    // Add more achievement progress tracking...
    
    return { nextAchievements };
  }

  /**
   * Get user's challenge history
   */
  async getUserChallengeHistory(
    userId: number, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<any[]> {
    return await db('challenge_submissions as cs')
      .join('challenges as c', 'cs.challenge_id', 'c.id')
      .where('cs.user_id', userId)
      .select(
        'cs.id',
        'cs.challenge_id',
        'cs.completed_at',
        'cs.is_correct',
        'cs.time_spent_seconds',
        'cs.xp_earned',
        'cs.feedback',
        'c.type',
        'c.difficulty',
        'c.title',
        'c.description'
      )
      .orderBy('cs.completed_at', 'desc')
      .limit(limit)
      .offset(offset);
  }
}

// Factory function for DI
export function createChallengeStatsService(): ChallengeStatsService {
  return new ChallengeStatsService();
}