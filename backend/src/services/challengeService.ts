import db from '../db';
import { 
  Challenge, 
  ChallengeType, 
  DifficultyLevel, 
  ChallengeSubmission, 
  UserChallengeStats,
  DailyChallengeSelection
} from '../models/Challenge';
import { User } from '../models/User';
import { addDays, startOfDay, differenceInDays, isYesterday, isToday } from 'date-fns';

export class ChallengeService {
  /**
   * Get all active challenges from the database
   */
  async getAllChallenges(filters?: {
    type?: ChallengeType;
    difficulty?: DifficultyLevel;
    isActive?: boolean;
  }): Promise<Challenge[]> {
    let query = db('challenges').select('*');
    
    if (filters?.type) {
      query = query.where('type', filters.type);
    }
    if (filters?.difficulty) {
      query = query.where('difficulty', filters.difficulty);
    }
    if (filters?.isActive !== undefined) {
      query = query.where('is_active', filters.isActive);
    }
    
    return await query;
  }

  /**
   * Get a specific challenge by ID
   */
  async getChallengeById(challengeId: number): Promise<Challenge | null> {
    const challenge = await db('challenges')
      .where('id', challengeId)
      .first();
    
    return challenge || null;
  }

  /**
   * Get today's challenge for a specific user with adaptive difficulty
   */
  async getTodaysChallengeForUser(userId: number): Promise<Challenge | null> {
    const today = startOfDay(new Date());
    
    // Check if user already has a challenge selected for today
    const existingSelection = await db('daily_challenge_selections')
      .where({
        user_id: userId,
        selection_date: today
      })
      .first();
    
    if (existingSelection) {
      return await this.getChallengeById(existingSelection.selected_challenge_id);
    }
    
    // Select a new challenge based on user performance
    const challenge = await this.selectAdaptiveChallenge(userId);
    
    if (challenge) {
      // Record the selection
      await db('daily_challenge_selections').insert({
        user_id: userId,
        selected_challenge_id: challenge.id,
        selection_date: today,
        selection_reason: challenge.selectionReason || 'adaptive',
        difficulty_adjustment: challenge.difficultyAdjustment || 0
      });
    }
    
    return challenge;
  }

  /**
   * Select an adaptive challenge based on user performance
   */
  private async selectAdaptiveChallenge(userId: number): Promise<any> {
    const stats = await this.getUserChallengeStats(userId);
    const recentSubmissions = await this.getRecentSubmissions(userId, 7);
    
    // Determine appropriate difficulty
    let targetDifficulty = DifficultyLevel.INTERMEDIATE;
    let difficultyAdjustment = 0;
    
    if (stats.total_completed === 0) {
      // New user, start with beginner
      targetDifficulty = DifficultyLevel.BEGINNER;
    } else {
      // Calculate success rate
      const successRate = stats.total_correct / stats.total_completed;
      
      if (successRate > 0.8 && recentSubmissions.length >= 3) {
        // User is doing very well, increase difficulty
        targetDifficulty = DifficultyLevel.ADVANCED;
        difficultyAdjustment = 1;
      } else if (successRate < 0.4) {
        // User is struggling, decrease difficulty
        targetDifficulty = DifficultyLevel.BEGINNER;
        difficultyAdjustment = -1;
      }
    }
    
    // Find weak areas based on type performance
    const weakestType = this.findWeakestChallengeType(stats);
    
    // Get challenges that match criteria
    let query = db('challenges')
      .where('is_active', true)
      .whereNotIn('id', recentSubmissions.map(s => s.challenge_id))
      .orderByRaw('RANDOM()')
      .limit(1);
    
    // Prioritize weak areas 60% of the time
    if (weakestType && Math.random() < 0.6) {
      query = query.where('type', weakestType);
    }
    
    // Apply difficulty filter
    query = query.where('difficulty', targetDifficulty);
    
    const challenge = await query.first();
    
    if (challenge) {
      challenge.selectionReason = weakestType ? `weak_area_${weakestType}` : 'adaptive_difficulty';
      challenge.difficultyAdjustment = difficultyAdjustment;
    }
    
    return challenge;
  }

  /**
   * Submit a challenge answer
   */
  async submitChallenge(
    userId: number, 
    challengeId: number, 
    answer: any, 
    timeSpentSeconds: number
  ): Promise<{
    isCorrect: boolean;
    feedback: string;
    xpEarned: number;
    streakInfo: {
      currentStreak: number;
      streakMaintained: boolean;
      isNewRecord: boolean;
    };
  }> {
    const challenge = await this.getChallengeById(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    // Check the answer
    const isCorrect = await this.checkAnswer(challenge, answer);
    
    // Calculate XP based on difficulty and time
    const xpEarned = this.calculateXP(challenge, isCorrect, timeSpentSeconds);
    
    // Generate feedback
    const feedback = this.generateFeedback(challenge, answer, isCorrect);
    
    // Record submission
    await db('challenge_submissions').insert({
      user_id: userId,
      challenge_id: challengeId,
      started_at: new Date(Date.now() - timeSpentSeconds * 1000),
      completed_at: new Date(),
      answer: JSON.stringify(answer),
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds,
      xp_earned: xpEarned,
      feedback: feedback,
      created_at: new Date()
    });
    
    // Update user stats and streak
    const streakInfo = await this.updateUserStreak(userId);
    
    // Update user's XP
    await db('users')
      .where('id', userId)
      .increment('echo_score', xpEarned);
    
    return {
      isCorrect,
      feedback,
      xpEarned,
      streakInfo
    };
  }

  /**
   * Check if an answer is correct based on challenge type
   */
  private async checkAnswer(challenge: Challenge, answer: any): Promise<boolean> {
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
   * Calculate XP reward based on challenge difficulty and performance
   */
  private calculateXP(challenge: Challenge, isCorrect: boolean, timeSpentSeconds: number): number {
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
   * Generate feedback for the user's answer
   */
  private generateFeedback(challenge: Challenge, answer: any, isCorrect: boolean): string {
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
   * Update user's streak information
   */
  private async updateUserStreak(userId: number): Promise<{
    currentStreak: number;
    streakMaintained: boolean;
    isNewRecord: boolean;
  }> {
    const user = await db('users').where('id', userId).first();
    const lastSubmission = await db('challenge_submissions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .offset(1) // Skip the one we just created
      .first();
    
    let currentStreak = user.current_streak || 0;
    let streakMaintained = false;
    let isNewRecord = false;
    
    if (!lastSubmission) {
      // First challenge
      currentStreak = 1;
      streakMaintained = true;
    } else {
      const lastDate = new Date(lastSubmission.created_at);
      const today = new Date();
      
      if (isYesterday(lastDate)) {
        // Continuing streak
        currentStreak += 1;
        streakMaintained = true;
      } else if (isToday(lastDate)) {
        // Already completed today, maintain streak
        streakMaintained = true;
      } else {
        // Streak broken
        currentStreak = 1;
        streakMaintained = false;
      }
    }
    
    // Check if it's a new record
    const stats = await this.getUserChallengeStats(userId);
    if (currentStreak > (stats.longest_streak || 0)) {
      isNewRecord = true;
      await db('user_challenge_stats')
        .where('user_id', userId)
        .update({ longest_streak: currentStreak });
    }
    
    // Update user's current streak
    await db('users')
      .where('id', userId)
      .update({ 
        current_streak: currentStreak,
        last_activity_date: new Date()
      });
    
    return {
      currentStreak,
      streakMaintained,
      isNewRecord
    };
  }

  /**
   * Get user's challenge statistics
   */
  async getUserChallengeStats(userId: number): Promise<UserChallengeStats> {
    // Check if stats exist
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
    
    // Update with latest data
    const submissions = await db('challenge_submissions as cs')
      .join('challenges as c', 'cs.challenge_id', 'c.id')
      .where('cs.user_id', userId)
      .select('cs.*', 'c.type', 'c.difficulty');
    
    stats.total_completed = submissions.length;
    stats.total_correct = submissions.filter(s => s.is_correct).length;
    
    // Calculate performance by difficulty and type
    const difficultyPerf: any = {};
    const typePerf: any = {};
    
    for (const level of Object.values(DifficultyLevel)) {
      const levelSubs = submissions.filter(s => s.difficulty === level);
      difficultyPerf[level] = {
        completed: levelSubs.length,
        correct: levelSubs.filter(s => s.is_correct).length,
        average_time_seconds: levelSubs.length > 0 
          ? levelSubs.reduce((sum, s) => sum + s.time_spent_seconds, 0) / levelSubs.length 
          : 0
      };
    }
    
    for (const type of Object.values(ChallengeType)) {
      const typeSubs = submissions.filter(s => s.type === type);
      typePerf[type] = {
        completed: typeSubs.length,
        correct: typeSubs.filter(s => s.is_correct).length,
        average_time_seconds: typeSubs.length > 0 
          ? typeSubs.reduce((sum, s) => sum + s.time_spent_seconds, 0) / typeSubs.length 
          : 0
      };
    }
    
    stats.difficulty_performance = difficultyPerf;
    stats.type_performance = typePerf;
    
    return stats;
  }

  /**
   * Get recent submissions for a user
   */
  private async getRecentSubmissions(userId: number, days: number): Promise<ChallengeSubmission[]> {
    const since = addDays(new Date(), -days);
    
    return await db('challenge_submissions')
      .where('user_id', userId)
      .where('created_at', '>=', since)
      .orderBy('created_at', 'desc');
  }

  /**
   * Find the weakest challenge type for a user
   */
  private findWeakestChallengeType(stats: UserChallengeStats): ChallengeType | null {
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
   * Get leaderboard data
   */
  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'allTime' = 'weekly'): Promise<any[]> {
    let query = db('users as u')
      .join('challenge_submissions as cs', 'u.id', 'cs.user_id')
      .select(
        'u.id',
        'u.username',
        'u.avatar_url',
        db.raw('COUNT(cs.id) as challenges_completed'),
        db.raw('SUM(cs.xp_earned) as total_xp'),
        db.raw('SUM(CASE WHEN cs.is_correct THEN 1 ELSE 0 END) as correct_answers')
      )
      .groupBy('u.id', 'u.username', 'u.avatar_url');
    
    // Apply timeframe filter
    if (timeframe === 'daily') {
      query = query.where('cs.created_at', '>=', startOfDay(new Date()));
    } else if (timeframe === 'weekly') {
      query = query.where('cs.created_at', '>=', addDays(new Date(), -7));
    }
    
    return await query
      .orderBy('total_xp', 'desc')
      .limit(100);
  }
}

export default new ChallengeService(); 