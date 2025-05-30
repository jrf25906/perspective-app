import db from '../db';
import { addDays, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export interface LeaderboardEntry {
  userId: number;
  username: string;
  avatarUrl?: string;
  challengesCompleted: number;
  totalXP: number;
  correctAnswers: number;
  accuracy: number;
  currentStreak: number;
  rank: number;
}

export class LeaderboardService {
  /**
   * Get leaderboard data for different timeframes
   */
  async getLeaderboard(
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly',
    limit: number = 100,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    let query = db('users as u')
      .join('challenge_submissions as cs', 'u.id', 'cs.user_id')
      .select(
        'u.id as userId',
        'u.username',
        'u.avatar_url as avatarUrl',
        'u.current_streak as currentStreak',
        db.raw('COUNT(cs.id) as challenges_completed'),
        db.raw('SUM(cs.xp_earned) as total_xp'),
        db.raw('SUM(CASE WHEN cs.is_correct THEN 1 ELSE 0 END) as correct_answers')
      )
      .groupBy('u.id', 'u.username', 'u.avatar_url', 'u.current_streak');
    
    // Apply timeframe filter
    const timeFilter = this.getTimeFilter(timeframe);
    if (timeFilter) {
      query = query.where('cs.created_at', '>=', timeFilter);
    }
    
    // Get the raw results
    const results = await query
      .orderBy('total_xp', 'desc')
      .limit(limit)
      .offset(offset);
    
    // Calculate accuracy and add rank
    return results.map((entry, index) => ({
      userId: entry.userId,
      username: entry.username,
      avatarUrl: entry.avatarUrl,
      challengesCompleted: parseInt(entry.challenges_completed),
      totalXP: parseInt(entry.total_xp),
      correctAnswers: parseInt(entry.correct_answers),
      accuracy: entry.challenges_completed > 0 
        ? Math.round((entry.correct_answers / entry.challenges_completed) * 100) 
        : 0,
      currentStreak: entry.currentStreak || 0,
      rank: offset + index + 1
    }));
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(
    userId: number, 
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly'
  ): Promise<number> {
    const timeFilter = this.getTimeFilter(timeframe);
    
    let query = db('users as u')
      .join('challenge_submissions as cs', 'u.id', 'cs.user_id')
      .select('u.id', db.raw('SUM(cs.xp_earned) as total_xp'))
      .groupBy('u.id');
    
    if (timeFilter) {
      query = query.where('cs.created_at', '>=', timeFilter);
    }
    
    const results = await query.orderBy('total_xp', 'desc');
    const userIndex = results.findIndex(r => r.id === userId);
    
    return userIndex === -1 ? 0 : userIndex + 1;
  }

  /**
   * Get top performers by category
   */
  async getTopPerformers(category: 'xp' | 'accuracy' | 'streak' | 'challenges', limit: number = 10): Promise<any[]> {
    switch (category) {
      case 'xp':
        return await db('users')
          .select('id', 'username', 'avatar_url', 'echo_score as value')
          .orderBy('echo_score', 'desc')
          .limit(limit);
        
      case 'accuracy':
        return await db('users as u')
          .join('user_challenge_stats as ucs', 'u.id', 'ucs.user_id')
          .select(
            'u.id',
            'u.username',
            'u.avatar_url',
            db.raw('ROUND((ucs.total_correct::float / NULLIF(ucs.total_completed, 0)) * 100, 2) as value')
          )
          .where('ucs.total_completed', '>', 10) // Minimum challenges for accuracy ranking
          .orderBy('value', 'desc')
          .limit(limit);
        
      case 'streak':
        return await db('users as u')
          .join('user_challenge_stats as ucs', 'u.id', 'ucs.user_id')
          .select('u.id', 'u.username', 'u.avatar_url', 'ucs.longest_streak as value')
          .orderBy('ucs.longest_streak', 'desc')
          .limit(limit);
        
      case 'challenges':
        return await db('users as u')
          .join('user_challenge_stats as ucs', 'u.id', 'ucs.user_id')
          .select('u.id', 'u.username', 'u.avatar_url', 'ucs.total_completed as value')
          .orderBy('ucs.total_completed', 'desc')
          .limit(limit);
        
      default:
        return [];
    }
  }

  /**
   * Get friends leaderboard
   */
  async getFriendsLeaderboard(
    userId: number,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly'
  ): Promise<LeaderboardEntry[]> {
    // Get user's friends (assuming a friends/followers table exists)
    const friendIds = await db('user_connections')
      .where(function() {
        this.where('user_id', userId).orWhere('friend_id', userId);
      })
      .where('status', 'accepted')
      .select(
        db.raw('CASE WHEN user_id = ? THEN friend_id ELSE user_id END as friend_id', [userId])
      )
      .pluck('friend_id');
    
    // Include the user themselves
    friendIds.push(userId);
    
    // Get leaderboard for friends
    let query = db('users as u')
      .join('challenge_submissions as cs', 'u.id', 'cs.user_id')
      .whereIn('u.id', friendIds)
      .select(
        'u.id as userId',
        'u.username',
        'u.avatar_url as avatarUrl',
        'u.current_streak as currentStreak',
        db.raw('COUNT(cs.id) as challenges_completed'),
        db.raw('SUM(cs.xp_earned) as total_xp'),
        db.raw('SUM(CASE WHEN cs.is_correct THEN 1 ELSE 0 END) as correct_answers')
      )
      .groupBy('u.id', 'u.username', 'u.avatar_url', 'u.current_streak');
    
    const timeFilter = this.getTimeFilter(timeframe);
    if (timeFilter) {
      query = query.where('cs.created_at', '>=', timeFilter);
    }
    
    const results = await query.orderBy('total_xp', 'desc');
    
    return results.map((entry, index) => ({
      userId: entry.userId,
      username: entry.username,
      avatarUrl: entry.avatarUrl,
      challengesCompleted: parseInt(entry.challenges_completed),
      totalXP: parseInt(entry.total_xp),
      correctAnswers: parseInt(entry.correct_answers),
      accuracy: entry.challenges_completed > 0 
        ? Math.round((entry.correct_answers / entry.challenges_completed) * 100) 
        : 0,
      currentStreak: entry.currentStreak || 0,
      rank: index + 1
    }));
  }

  /**
   * Get time filter based on timeframe
   */
  private getTimeFilter(timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'): Date | null {
    switch (timeframe) {
      case 'daily':
        return startOfDay(new Date());
      case 'weekly':
        return startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
      case 'monthly':
        return startOfMonth(new Date());
      case 'allTime':
        return null;
      default:
        return startOfWeek(new Date(), { weekStartsOn: 1 });
    }
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(): Promise<{
    totalPlayers: number;
    totalChallengesCompleted: number;
    averageAccuracy: number;
    topStreak: number;
  }> {
    const stats = await db('user_challenge_stats')
      .select(
        db.raw('COUNT(DISTINCT user_id) as total_players'),
        db.raw('SUM(total_completed) as total_challenges'),
        db.raw('AVG(CASE WHEN total_completed > 0 THEN (total_correct::float / total_completed) * 100 ELSE 0 END) as avg_accuracy'),
        db.raw('MAX(longest_streak) as top_streak')
      )
      .first() as any;
    
    return {
      totalPlayers: parseInt(stats?.total_players) || 0,
      totalChallengesCompleted: parseInt(stats?.total_challenges) || 0,
      averageAccuracy: Math.round(parseFloat(stats?.avg_accuracy) || 0),
      topStreak: parseInt(stats?.top_streak) || 0
    };
  }
}

export default new LeaderboardService(); 