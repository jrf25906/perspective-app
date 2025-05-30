import { Challenge } from '../models/Challenge';

/**
 * Interface for XP (Experience Points) Service
 * Handles XP calculations and management
 */
export interface IXPService {
  /**
   * Calculate XP based on challenge difficulty, correctness, and time spent
   */
  calculateXP(challenge: Challenge, isCorrect: boolean, timeSpentSeconds: number): number;

  /**
   * Award XP to a user
   */
  awardXP(userId: number, amount: number, reason: string): Promise<void>;

  /**
   * Check and award achievements based on user progress
   */
  checkAndAwardAchievements(userId: number): Promise<void>;

  /**
   * Get user's current XP and level
   */
  getUserXPInfo(userId: number): Promise<{
    totalXP: number;
    currentLevel: number;
    xpToNextLevel: number;
  }>;
} 