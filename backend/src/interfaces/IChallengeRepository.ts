import { 
  Challenge, 
  ChallengeType, 
  DifficultyLevel,
  DailyChallengeSelection
} from '../models/Challenge';

/**
 * Interface for Challenge Repository
 * Handles data access operations for challenges
 */
export interface IChallengeRepository {
  /**
   * Get all challenges with optional filters
   */
  getAllChallenges(filters?: {
    type?: ChallengeType;
    difficulty?: DifficultyLevel;
    isActive?: boolean;
  }): Promise<Challenge[]>;

  /**
   * Get a specific challenge by ID
   */
  getChallengeById(challengeId: number): Promise<Challenge | null>;

  /**
   * Get today's challenge selection for a user
   */
  getTodaysChallengeSelection(userId: number): Promise<DailyChallengeSelection | null>;

  /**
   * Record a daily challenge selection
   */
  recordDailyChallengeSelection(userId: number, challengeId: number): Promise<void>;
} 