import { Challenge, ChallengeType } from '../models/Challenge';

export class ChallengeAnswerService {
  /**
   * Check if an answer is correct based on challenge type
   */
  async checkAnswer(challenge: Challenge, answer: any): Promise<boolean> {
    switch (challenge.type) {
      case ChallengeType.LOGIC_PUZZLE:
      case ChallengeType.DATA_LITERACY:
        // For multiple choice questions
        return answer === challenge.correct_answer;
        
      case ChallengeType.BIAS_SWAP:
        // Check if user correctly identified bias indicators
        const correctIndicators = challenge.correct_answer as string[];
        const userIndicators = answer as string[];
        return this.calculateArraySimilarity(correctIndicators, userIndicators) > 0.7;
        
      case ChallengeType.COUNTER_ARGUMENT:
      case ChallengeType.SYNTHESIS:
      case ChallengeType.ETHICAL_DILEMMA:
        // These require more complex evaluation
        // For now, we'll use a simple word count and keyword check
        return this.evaluateTextResponse(answer, challenge.correct_answer);
        
      default:
        return false;
    }
  }

  /**
   * Generate feedback for the user's answer
   */
  generateFeedback(challenge: Challenge, answer: any, isCorrect: boolean): string {
    if (isCorrect) {
      return challenge.explanation || "Great job! You've correctly completed this challenge.";
    } else {
      const baseExplanation = challenge.explanation || "Not quite right. Let's review the concept.";
      
      // Add specific feedback based on challenge type
      switch (challenge.type) {
        case ChallengeType.LOGIC_PUZZLE:
          return `${baseExplanation} Remember to carefully analyze each option and look for logical flaws.`;
          
        case ChallengeType.BIAS_SWAP:
          return `${baseExplanation} Try to identify specific language that indicates bias, such as loaded words or one-sided framing.`;
          
        case ChallengeType.DATA_LITERACY:
          return `${baseExplanation} When analyzing data, look for misleading scales, cherry-picked data points, or missing context.`;
          
        default:
          return baseExplanation;
      }
    }
  }

  /**
   * Calculate similarity between two arrays (for bias indicators)
   */
  private calculateArraySimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Evaluate text responses (simplified version)
   */
  private evaluateTextResponse(userAnswer: string, expectedCriteria: any): boolean {
    // This is a simplified evaluation
    // In a real implementation, you might use NLP or AI evaluation
    
    if (typeof expectedCriteria === 'object' && expectedCriteria.keywords) {
      const keywords = expectedCriteria.keywords as string[];
      const answerLower = userAnswer.toLowerCase();
      const matchedKeywords = keywords.filter(kw => answerLower.includes(kw.toLowerCase()));
      
      return matchedKeywords.length >= (expectedCriteria.minKeywords || 1);
    }
    
    // Basic length check for now
    return userAnswer.trim().split(/\s+/).length >= 50;
  }

  /**
   * Calculate answer quality score (0-1)
   */
  async calculateAnswerQuality(challenge: Challenge, answer: any, timeSpentSeconds: number): Promise<number> {
    const isCorrect = await this.checkAnswer(challenge, answer);
    let qualityScore = isCorrect ? 1.0 : 0.3;
    
    // Adjust for time spent
    const expectedTime = challenge.estimated_time_minutes * 60;
    if (isCorrect && timeSpentSeconds < expectedTime * 0.5) {
      qualityScore = Math.min(1.0, qualityScore * 1.1); // Quick and correct
    } else if (timeSpentSeconds > expectedTime * 2) {
      qualityScore *= 0.9; // Took too long
    }
    
    return qualityScore;
  }
}

// Factory function for DI
export function createChallengeAnswerService(): ChallengeAnswerService {
  return new ChallengeAnswerService();
}