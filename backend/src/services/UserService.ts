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

  static async findById(id: number): Promise<User | undefined> {
    return db<User>('users').where({ id }).first();
  }

  static async updateLastActivity(id: number): Promise<void> {
    await db('users')
      .where({ id })
      .update({ last_activity_date: db.fn.now(), updated_at: db.fn.now() });
  }
}
