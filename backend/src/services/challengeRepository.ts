import db from '../db';
import { 
  Challenge, 
  ChallengeType, 
  DifficultyLevel,
  DailyChallengeSelection
} from '../models/Challenge';

export class ChallengeRepository {
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
   * Get today's challenge selection for a user
   */
  async getTodaysChallengeSelection(userId: number): Promise<DailyChallengeSelection | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selection = await db('daily_challenge_selections')
      .where({
        user_id: userId,
        selection_date: today
      })
      .first();
    
    return selection || null;
  }

  /**
   * Save daily challenge selection
   */
  async saveDailyChallengeSelection(
    userId: number, 
    challengeId: number, 
    selectionDate: Date
  ): Promise<void> {
    await db('daily_challenge_selections').insert({
      user_id: userId,
      selected_challenge_id: challengeId,
      selection_date: selectionDate
    });
  }

  /**
   * Get challenges by IDs
   */
  async getChallengesByIds(challengeIds: number[]): Promise<Challenge[]> {
    return await db('challenges')
      .whereIn('id', challengeIds)
      .select('*');
  }

  /**
   * Get random challenges by criteria
   */
  async getRandomChallenges(
    count: number,
    filters?: {
      type?: ChallengeType;
      difficulty?: DifficultyLevel;
      excludeIds?: number[];
    }
  ): Promise<Challenge[]> {
    let query = db('challenges')
      .where('is_active', true);
    
    if (filters?.type) {
      query = query.where('type', filters.type);
    }
    if (filters?.difficulty) {
      query = query.where('difficulty', filters.difficulty);
    }
    if (filters?.excludeIds && filters.excludeIds.length > 0) {
      query = query.whereNotIn('id', filters.excludeIds);
    }
    
    return await query
      .orderByRaw('RANDOM()')
      .limit(count);
  }
}

export default new ChallengeRepository(); 