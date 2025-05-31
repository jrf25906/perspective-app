import db from '../db';
import { 
  Challenge, 
  ChallengeType, 
  DifficultyLevel, 
  ChallengeSubmission,
  UserChallengeStats
} from '../models/Challenge';
import { User, BiasProfile } from '../models/User';
import { BiasRating } from '../models/Content';
import { addDays, differenceInDays, startOfDay } from 'date-fns';
import { processInBatches } from '../utils/concurrentProcessing';

interface AdaptiveChallengeConfig {
  // Difficulty adjustment thresholds
  INCREASE_DIFFICULTY_THRESHOLD: number;
  DECREASE_DIFFICULTY_THRESHOLD: number;
  MIN_CHALLENGES_FOR_ADJUSTMENT: number;
  
  // Bias-related weights
  BIAS_CHALLENGE_WEIGHT: number;
  WEAKNESS_FOCUS_WEIGHT: number;
  DIVERSITY_WEIGHT: number;
  
  // History considerations
  RECENT_DAYS_TO_CONSIDER: number;
  REPEAT_PREVENTION_DAYS: number;
  
  // Performance tracking
  PERFORMANCE_WINDOW_DAYS: number;
  STREAK_BONUS_WEIGHT: number;
}

interface ChallengeScore {
  challenge: Challenge;
  score: number;
  reasons: string[];
}

interface UserPerformanceProfile {
  overallSuccessRate: number;
  recentSuccessRate: number;
  typePerformance: Map<ChallengeType, { successRate: number; avgTime: number }>;
  difficultyPerformance: Map<DifficultyLevel, { successRate: number; avgTime: number }>;
  streakMultiplier: number;
  lastChallengeTypes: ChallengeType[];
  biasExposure: Map<BiasRating, number>;
}

export class AdaptiveChallengeService {
  private config: AdaptiveChallengeConfig = {
    INCREASE_DIFFICULTY_THRESHOLD: 0.85,
    DECREASE_DIFFICULTY_THRESHOLD: 0.40,
    MIN_CHALLENGES_FOR_ADJUSTMENT: 3,
    BIAS_CHALLENGE_WEIGHT: 0.3,
    WEAKNESS_FOCUS_WEIGHT: 0.25,
    DIVERSITY_WEIGHT: 0.2,
    RECENT_DAYS_TO_CONSIDER: 14,
    REPEAT_PREVENTION_DAYS: 7,
    PERFORMANCE_WINDOW_DAYS: 30,
    STREAK_BONUS_WEIGHT: 0.1
  };

  /**
   * Get the next adaptive challenge for a user
   */
  async getNextChallengeForUser(userId: number): Promise<Challenge | null> {
    // Get user profile and performance data
    const [user, performanceProfile, availableChallenges] = await Promise.all([
      this.getUserWithBiasProfile(userId),
      this.buildUserPerformanceProfile(userId),
      this.getAvailableChallenges(userId)
    ]);

    if (!user || availableChallenges.length === 0) {
      return null;
    }

    // Score all available challenges
    const scoredChallenges = await this.scoreChallenges(
      availableChallenges,
      user,
      performanceProfile
    );

    // Select the best challenge
    const selectedChallenge = this.selectBestChallenge(scoredChallenges);

    if (selectedChallenge) {
      // Record the selection with detailed reasoning
      await this.recordChallengeSelection(
        userId,
        selectedChallenge.challenge.id,
        selectedChallenge.reasons
      );
    }

    return selectedChallenge?.challenge || null;
  }

  /**
   * Build a comprehensive performance profile for the user
   */
  private async buildUserPerformanceProfile(userId: number): Promise<UserPerformanceProfile> {
    const windowStart = addDays(new Date(), -this.config.PERFORMANCE_WINDOW_DAYS);
    const recentStart = addDays(new Date(), -this.config.RECENT_DAYS_TO_CONSIDER);

    // Get all submissions within the performance window
    const submissions = await db('challenge_submissions as cs')
      .join('challenges as c', 'cs.challenge_id', 'c.id')
      .where('cs.user_id', userId)
      .where('cs.created_at', '>=', windowStart)
      .select(
        'cs.*',
        'c.type',
        'c.difficulty',
        db.raw('c.content->\'articles\' as challenge_articles')
      )
      .orderBy('cs.created_at', 'desc');

    // Calculate performance metrics
    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter(s => s.is_correct).length;
    const overallSuccessRate = totalSubmissions > 0 ? correctSubmissions / totalSubmissions : 0.5;

    // Recent performance
    const recentSubmissions = submissions.filter(s => new Date(s.created_at) >= recentStart);
    const recentCorrect = recentSubmissions.filter(s => s.is_correct).length;
    const recentSuccessRate = recentSubmissions.length > 0 
      ? recentCorrect / recentSubmissions.length 
      : overallSuccessRate;

    // Type performance
    const typePerformance = new Map<ChallengeType, { successRate: number; avgTime: number }>();
    for (const type of Object.values(ChallengeType)) {
      const typeSubmissions = submissions.filter(s => s.type === type);
      if (typeSubmissions.length > 0) {
        const correct = typeSubmissions.filter(s => s.is_correct).length;
        const avgTime = typeSubmissions.reduce((sum, s) => sum + s.time_spent_seconds, 0) / typeSubmissions.length;
        typePerformance.set(type, {
          successRate: correct / typeSubmissions.length,
          avgTime
        });
      }
    }

    // Difficulty performance
    const difficultyPerformance = new Map<DifficultyLevel, { successRate: number; avgTime: number }>();
    for (const level of Object.values(DifficultyLevel)) {
      const levelSubmissions = submissions.filter(s => s.difficulty === level);
      if (levelSubmissions.length > 0) {
        const correct = levelSubmissions.filter(s => s.is_correct).length;
        const avgTime = levelSubmissions.reduce((sum, s) => sum + s.time_spent_seconds, 0) / levelSubmissions.length;
        difficultyPerformance.set(level, {
          successRate: correct / levelSubmissions.length,
          avgTime
        });
      }
    }

    // Get user's current streak for multiplier
    const user = await db('users').where('id', userId).first();
    const streakMultiplier = 1 + (user.current_streak * 0.02); // 2% bonus per day

    // Track recent challenge types for diversity
    const lastChallengeTypes = recentSubmissions
      .slice(0, 5)
      .map(s => s.type as ChallengeType);

    // Track bias exposure from bias swap challenges
    const biasExposure = new Map<BiasRating, number>();
    const biasSwapSubmissions = submissions.filter(s => s.type === ChallengeType.BIAS_SWAP);
    
    for (const submission of biasSwapSubmissions) {
      if (submission.challenge_articles) {
        try {
          const articles = JSON.parse(submission.challenge_articles);
          for (const article of articles) {
            if (article.bias_rating) {
              const currentCount = biasExposure.get(article.bias_rating) || 0;
              biasExposure.set(article.bias_rating, currentCount + 1);
            }
          }
        } catch (e) {
          console.error('Error parsing challenge articles:', e);
        }
      }
    }

    return {
      overallSuccessRate,
      recentSuccessRate,
      typePerformance,
      difficultyPerformance,
      streakMultiplier,
      lastChallengeTypes,
      biasExposure
    };
  }

  /**
   * Score challenges based on user profile and performance
   */
  private async scoreChallenges(
    challenges: Challenge[],
    user: User,
    performanceProfile: UserPerformanceProfile
  ): Promise<ChallengeScore[]> {
    const scoredChallenges: ChallengeScore[] = [];

    for (const challenge of challenges) {
      let score = 100; // Base score
      const reasons: string[] = [];

      // 1. Difficulty Appropriateness (30% weight)
      const difficultyScore = this.calculateDifficultyScore(
        challenge.difficulty,
        performanceProfile
      );
      score *= (difficultyScore * 0.3 + 0.7); // 30% weight
      if (difficultyScore > 0.8) {
        reasons.push('Appropriate difficulty level');
      }

      // 2. Type Weakness Focus (25% weight)
      const weaknessScore = this.calculateWeaknessScore(
        challenge.type,
        performanceProfile
      );
      score *= (weaknessScore * this.config.WEAKNESS_FOCUS_WEIGHT + (1 - this.config.WEAKNESS_FOCUS_WEIGHT));
      if (weaknessScore > 0.7) {
        reasons.push(`Targets weak area: ${challenge.type}`);
      }

      // 3. Bias Exposure Diversity (30% weight for bias swap challenges)
      if (challenge.type === ChallengeType.BIAS_SWAP && user.bias_profile) {
        const biasScore = await this.calculateBiasScore(
          challenge,
          user.bias_profile,
          performanceProfile.biasExposure
        );
        score *= (biasScore * this.config.BIAS_CHALLENGE_WEIGHT + (1 - this.config.BIAS_CHALLENGE_WEIGHT));
        if (biasScore > 0.8) {
          reasons.push('Expands bias perspective');
        }
      }

      // 4. Type Diversity (20% weight)
      const diversityScore = this.calculateDiversityScore(
        challenge.type,
        performanceProfile.lastChallengeTypes
      );
      score *= (diversityScore * this.config.DIVERSITY_WEIGHT + (1 - this.config.DIVERSITY_WEIGHT));
      if (diversityScore > 0.8) {
        reasons.push('Adds variety to challenge types');
      }

      // 5. Streak Bonus
      score *= performanceProfile.streakMultiplier;
      if (performanceProfile.streakMultiplier > 1.1) {
        reasons.push(`Streak bonus: ${Math.floor((performanceProfile.streakMultiplier - 1) * 100)}%`);
      }

      // 6. Time-based factors
      const timeScore = this.calculateTimeBasedScore(challenge, performanceProfile);
      score *= timeScore;
      if (timeScore < 0.9) {
        reasons.push('Adjusted for time constraints');
      }

      scoredChallenges.push({
        challenge,
        score,
        reasons
      });
    }

    return scoredChallenges.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate difficulty appropriateness score
   */
  private calculateDifficultyScore(
    challengeDifficulty: DifficultyLevel,
    profile: UserPerformanceProfile
  ): number {
    const recentSuccess = profile.recentSuccessRate;
    
    // Determine target difficulty based on performance
    let targetDifficulty = DifficultyLevel.INTERMEDIATE;
    
    if (profile.overallSuccessRate === 0) {
      // New user
      targetDifficulty = DifficultyLevel.BEGINNER;
    } else if (recentSuccess >= this.config.INCREASE_DIFFICULTY_THRESHOLD) {
      // Performing very well
      if (challengeDifficulty === DifficultyLevel.BEGINNER) {
        targetDifficulty = DifficultyLevel.INTERMEDIATE;
      } else if (challengeDifficulty === DifficultyLevel.INTERMEDIATE) {
        targetDifficulty = DifficultyLevel.ADVANCED;
      } else {
        targetDifficulty = DifficultyLevel.ADVANCED;
      }
    } else if (recentSuccess <= this.config.DECREASE_DIFFICULTY_THRESHOLD) {
      // Struggling
      if (challengeDifficulty === DifficultyLevel.ADVANCED) {
        targetDifficulty = DifficultyLevel.INTERMEDIATE;
      } else if (challengeDifficulty === DifficultyLevel.INTERMEDIATE) {
        targetDifficulty = DifficultyLevel.BEGINNER;
      } else {
        targetDifficulty = DifficultyLevel.BEGINNER;
      }
    }

    // Score based on how close the challenge is to target difficulty
    if (challengeDifficulty === targetDifficulty) {
      return 1.0;
    } else if (Math.abs(this.difficultyToNumber(challengeDifficulty) - this.difficultyToNumber(targetDifficulty)) === 1) {
      return 0.7; // Adjacent difficulty
    } else {
      return 0.3; // Too far from target
    }
  }

  /**
   * Calculate weakness focus score
   */
  private calculateWeaknessScore(
    challengeType: ChallengeType,
    profile: UserPerformanceProfile
  ): number {
    const typePerf = profile.typePerformance.get(challengeType);
    
    if (!typePerf) {
      // New type for user - moderate priority
      return 0.6;
    }

    // Prioritize types with lower success rates
    if (typePerf.successRate < 0.4) {
      return 1.0; // High priority
    } else if (typePerf.successRate < 0.6) {
      return 0.8; // Medium priority
    } else if (typePerf.successRate < 0.8) {
      return 0.5; // Low priority
    } else {
      return 0.3; // User is already proficient
    }
  }

  /**
   * Calculate bias exposure score for bias swap challenges
   */
  private async calculateBiasScore(
    challenge: Challenge,
    userBiasProfile: BiasProfile,
    biasExposure: Map<BiasRating, number>
  ): Promise<number> {
    let score = 0.5; // Base score

    // Parse challenge content to get bias ratings
    if (challenge.content && challenge.content.articles) {
      const articles = challenge.content.articles as any[];
      const challengeBiases = new Set<BiasRating>();
      
      for (const article of articles) {
        if (article.bias_rating) {
          challengeBiases.add(article.bias_rating);
        }
      }

      // Check if challenge includes underexposed biases
      const totalExposure = Array.from(biasExposure.values()).reduce((sum, count) => sum + count, 0);
      let underexposedBiasCount = 0;
      
      for (const bias of challengeBiases) {
        const exposureCount = biasExposure.get(bias) || 0;
        const exposureRate = totalExposure > 0 ? exposureCount / totalExposure : 0;
        
        if (exposureRate < 0.15) { // Less than 15% exposure
          underexposedBiasCount++;
        }
      }

      // Bonus for underexposed biases
      score += underexposedBiasCount * 0.2;

      // Check if challenge counters user's natural bias
      if (userBiasProfile.political_lean !== 0) {
        const userLeaningRight = userBiasProfile.political_lean > 0;
        const hasOpposingView = Array.from(challengeBiases).some(bias => {
          const biasScore = this.biasRatingToScore(bias);
          return userLeaningRight ? biasScore < -1 : biasScore > 1;
        });

        if (hasOpposingView) {
          score += 0.3; // Bonus for opposing viewpoint
        }
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate diversity score to avoid repetition
   */
  private calculateDiversityScore(
    challengeType: ChallengeType,
    recentTypes: ChallengeType[]
  ): number {
    if (recentTypes.length === 0) {
      return 1.0;
    }

    // Count how many times this type appears in recent challenges
    const typeCount = recentTypes.filter(t => t === challengeType).length;
    
    if (typeCount === 0) {
      return 1.0; // Haven't done this type recently
    } else if (typeCount === 1) {
      return 0.7; // Did once recently
    } else if (typeCount === 2) {
      return 0.4; // Did twice recently
    } else {
      return 0.1; // Too repetitive
    }
  }

  /**
   * Calculate time-based score
   */
  private calculateTimeBasedScore(
    challenge: Challenge,
    profile: UserPerformanceProfile
  ): number {
    // Get average time for this type
    const typePerf = profile.typePerformance.get(challenge.type);
    if (!typePerf) {
      return 1.0; // No adjustment for new types
    }

    // If user typically takes much longer than estimated, slight penalty
    const estimatedSeconds = challenge.estimated_time_minutes * 60;
    const timeRatio = typePerf.avgTime / estimatedSeconds;
    
    if (timeRatio > 2) {
      return 0.8; // Takes twice as long
    } else if (timeRatio > 1.5) {
      return 0.9; // Takes 50% longer
    } else {
      return 1.0; // Within reasonable time
    }
  }

  /**
   * Select the best challenge from scored options
   */
  private selectBestChallenge(scoredChallenges: ChallengeScore[]): ChallengeScore | null {
    if (scoredChallenges.length === 0) {
      return null;
    }

    // Use weighted random selection from top candidates
    // This adds some variety while still favoring higher scores
    const topCandidates = scoredChallenges.slice(0, Math.min(5, scoredChallenges.length));
    
    // Calculate total weight
    const totalWeight = topCandidates.reduce((sum, c) => sum + c.score, 0);
    
    // Random selection
    let random = Math.random() * totalWeight;
    
    for (const candidate of topCandidates) {
      random -= candidate.score;
      if (random <= 0) {
        return candidate;
      }
    }

    // Fallback to highest score
    return scoredChallenges[0];
  }

  /**
   * Get available challenges for a user
   */
  private async getAvailableChallenges(userId: number): Promise<Challenge[]> {
    const preventRepeatDate = addDays(new Date(), -this.config.REPEAT_PREVENTION_DAYS);

    // Get recently completed challenge IDs
    const recentChallengeIds = await db('challenge_submissions')
      .where('user_id', userId)
      .where('created_at', '>=', preventRepeatDate)
      .pluck('challenge_id');

    // Get active challenges not recently completed
    return await db('challenges')
      .where('is_active', true)
      .whereNotIn('id', recentChallengeIds)
      .select('*');
  }

  /**
   * Get user with bias profile
   */
  private async getUserWithBiasProfile(userId: number): Promise<User | null> {
    return await db('users')
      .where('id', userId)
      .first();
  }

  /**
   * Record challenge selection with reasoning
   */
  private async recordChallengeSelection(
    userId: number,
    challengeId: number,
    reasons: string[]
  ): Promise<void> {
    await db('daily_challenge_selections').insert({
      user_id: userId,
      selected_challenge_id: challengeId,
      selection_date: startOfDay(new Date()),
      selection_reason: reasons.join('; '),
      difficulty_adjustment: 0, // Could calculate this if needed
      created_at: new Date()
    });
  }

  /**
   * Helper: Convert difficulty to number for comparison
   */
  private difficultyToNumber(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER: return 1;
      case DifficultyLevel.INTERMEDIATE: return 2;
      case DifficultyLevel.ADVANCED: return 3;
      default: return 2;
    }
  }

  /**
   * Helper: Convert bias rating to numerical score
   */
  private biasRatingToScore(rating: BiasRating): number {
    switch (rating) {
      case BiasRating.FAR_LEFT: return -3;
      case BiasRating.LEFT: return -2;
      case BiasRating.LEFT_CENTER: return -1;
      case BiasRating.CENTER: return 0;
      case BiasRating.RIGHT_CENTER: return 1;
      case BiasRating.RIGHT: return 2;
      case BiasRating.FAR_RIGHT: return 3;
      default: return 0;
    }
  }

  /**
   * Get adaptive challenge recommendations for a user
   */
  async getAdaptiveChallengeRecommendations(
    userId: number,
    count: number = 3
  ): Promise<Challenge[]> {
    // Generate more recommendations than needed to account for duplicates
    const oversampleFactor = 1.5;
    const recommendationsToGenerate = Math.ceil(count * oversampleFactor);
    
    // Generate recommendations concurrently
    const challengePromises = Array.from(
      { length: recommendationsToGenerate }, 
      () => this.getNextChallengeForUser(userId)
    );
    
    const challenges = await Promise.all(challengePromises);
    
    // Filter out nulls and deduplicate by challenge ID
    const uniqueChallenges = new Map<number, Challenge>();
    
    for (const challenge of challenges) {
      if (challenge && !uniqueChallenges.has(challenge.id)) {
        uniqueChallenges.set(challenge.id, challenge);
        
        // Stop once we have enough unique challenges
        if (uniqueChallenges.size >= count) {
          break;
        }
      }
    }
    
    // If we still don't have enough unique challenges, try a different approach
    if (uniqueChallenges.size < count) {
      // Get all available challenges and score them in bulk
      const availableChallenges = await this.getAvailableChallenges(userId);
      const user = await this.getUserWithBiasProfile(userId);
      
      if (user && availableChallenges.length > 0) {
        const performanceProfile = await this.buildUserPerformanceProfile(userId);
        const scoredChallenges = await this.scoreChallenges(
          availableChallenges,
          user,
          performanceProfile
        );
        
        // Add top-scored challenges that aren't already in our set
        for (const scoredChallenge of scoredChallenges) {
          if (!uniqueChallenges.has(scoredChallenge.challenge.id)) {
            uniqueChallenges.set(scoredChallenge.challenge.id, scoredChallenge.challenge);
            
            if (uniqueChallenges.size >= count) {
              break;
            }
          }
        }
      }
    }
    
    return Array.from(uniqueChallenges.values()).slice(0, count);
  }

  /**
   * Analyze user's learning progress
   */
  async analyzeUserProgress(userId: number): Promise<{
    strengths: ChallengeType[];
    weaknesses: ChallengeType[];
    recommendedFocus: ChallengeType[];
    progressTrend: 'improving' | 'stable' | 'declining';
  }> {
    const profile = await this.buildUserPerformanceProfile(userId);
    
    // Identify strengths and weaknesses
    const strengths: ChallengeType[] = [];
    const weaknesses: ChallengeType[] = [];
    
    for (const [type, perf] of profile.typePerformance) {
      if (perf.successRate >= 0.8) {
        strengths.push(type);
      } else if (perf.successRate < 0.5) {
        weaknesses.push(type);
      }
    }

    // Determine progress trend
    let progressTrend: 'improving' | 'stable' | 'declining';
    const successDiff = profile.recentSuccessRate - profile.overallSuccessRate;
    
    if (successDiff > 0.1) {
      progressTrend = 'improving';
    } else if (successDiff < -0.1) {
      progressTrend = 'declining';
    } else {
      progressTrend = 'stable';
    }

    // Suggested focus areas (weaknesses that haven't been attempted much recently)
    const recommendedFocus = weaknesses.filter(w => 
      profile.lastChallengeTypes.filter(t => t === w).length < 2
    );

    return {
      strengths,
      weaknesses,
      recommendedFocus,
      progressTrend
    };
  }
}

export default new AdaptiveChallengeService();
