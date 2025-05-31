import { Challenge } from '../models/Challenge';

/**
 * Interface for Challenge Answer Service
 * Handles answer validation and feedback generation
 */
export interface IChallengeAnswerService {
  /**
   * Check if the answer is correct for a given challenge
   */
  checkAnswer(challenge: Challenge, answer: any): Promise<boolean>;
  
  /**
   * Generate feedback for the user's answer
   */
  generateFeedback(challenge: Challenge, answer: any, isCorrect: boolean): string;
} 