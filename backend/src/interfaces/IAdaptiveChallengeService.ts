import { Challenge } from '../models/Challenge';

/**
 * Interface for Adaptive Challenge Service
 * Handles intelligent challenge selection based on user performance
 */
export interface IAdaptiveChallengeService {
  /**
   * Get the next challenge for a user based on their performance and preferences
   */
  getNextChallengeForUser(userId: number): Promise<Challenge | null>;

  /**
   * Get multiple challenge recommendations for a user
   */
  getAdaptiveChallengeRecommendations(userId: number, count: number): Promise<Challenge[]>;

  /**
   * Analyze user's progress and performance patterns
   */
  analyzeUserProgress(userId: number): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendedFocus: string[];
    progressTrend: 'improving' | 'stable' | 'declining';
  }>;
} 