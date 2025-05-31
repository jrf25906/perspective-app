/**
 * Interface for Leaderboard Service
 * Manages leaderboard data across different timeframes
 */
export interface ILeaderboardService {
  /**
   * Get leaderboard data for a specific timeframe
   * @param timeframe - The timeframe for the leaderboard (daily, weekly, or all-time)
   * @returns Array of leaderboard entries with user info and scores
   */
  getLeaderboard(timeframe: 'daily' | 'weekly' | 'allTime'): Promise<{
    rank: number;
    userId: number;
    username: string;
    score: number;
    challengesCompleted: number;
    accuracy: number;
  }[]>;
} 