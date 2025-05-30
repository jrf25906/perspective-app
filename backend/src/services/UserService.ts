import db from '../db';
import { User } from '../models/User';

export class UserService {
  static async findByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    return db<User>('users')
      .where('email', email)
      .orWhere('username', username)
      .first();
  }

  static async create(userData: Partial<User>): Promise<User> {
    const [user] = await db<User>('users')
      .insert(userData)
      .returning('*');
    return user;
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    return db<User>('users').where({ email }).first();
  }

  static async findByUsername(username: string): Promise<User | undefined> {
    return db<User>('users').where({ username }).first();
  }

  static async findById(id: number): Promise<User | undefined> {
    return db<User>('users').where({ id }).first();
  }

  static async updateLastActivity(id: number): Promise<void> {
    await db('users')
      .where({ id })
      .update({ last_activity_date: db.fn.now(), updated_at: db.fn.now() });
  }

  static async updateGoogleInfo(id: number, googleInfo: { google_id: string; avatar_url?: string; email_verified?: boolean }): Promise<void> {
    await db('users')
      .where({ id })
      .update({ 
        ...googleInfo, 
        updated_at: db.fn.now() 
      });
  }

  static async updateProfile(id: number, profileData: Partial<User>): Promise<User> {
    const [updatedUser] = await db<User>('users')
      .where({ id })
      .update({
        ...profileData,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return updatedUser;
  }

  static async isEmailTaken(email: string, excludeUserId?: number): Promise<boolean> {
    const query = db<User>('users').where({ email });
    
    if (excludeUserId) {
      query.andWhere('id', '!=', excludeUserId);
    }
    
    const user = await query.first();
    return !!user;
  }

  static async isUsernameTaken(username: string, excludeUserId?: number): Promise<boolean> {
    const query = db<User>('users').where({ username });
    
    if (excludeUserId) {
      query.andWhere('id', '!=', excludeUserId);
    }
    
    const user = await query.first();
    return !!user;
  }

  static async getUserStats(id: number): Promise<{
    totalChallengesCompleted: number;
    averageAccuracy: number;
    totalTimeSpent: number;
  }> {
    // This is a placeholder - in a real app you'd query the challenges/submissions tables
    // For now, return mock data
    return {
      totalChallengesCompleted: 0,
      averageAccuracy: 0,
      totalTimeSpent: 0
    };
  }
}
