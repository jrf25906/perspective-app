import { User } from '../models/User';
import { UserResponse } from '../types/api-contracts';

/**
 * Service responsible for transforming user data from database format to API format
 * Follows Single Responsibility Principle - only handles user data transformation
 */
export class UserTransformService {
  /**
   * Transform a database user record to match iOS API contract
   * @param dbUser User record from database
   * @returns Transformed user matching UserResponse interface
   */
  static transformUserForAPI(dbUser: User | undefined): UserResponse | undefined {
    if (!dbUser) return undefined;

    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      firstName: dbUser.first_name || null,
      lastName: dbUser.last_name || null,
      avatarUrl: dbUser.avatar_url || null,
      isActive: Boolean(dbUser.is_active),
      emailVerified: Boolean(dbUser.email_verified),
      echoScore: this.parseNumericField(dbUser.echo_score, 0),
      biasProfile: this.parseBiasProfile(dbUser.bias_profile),
      preferredChallengeTime: dbUser.preferred_challenge_time || null,
      currentStreak: this.parseNumericField(dbUser.current_streak, 0),
      lastActivityDate: this.formatDate(dbUser.last_activity_date),
      createdAt: this.formatDate(dbUser.created_at),
      updatedAt: this.formatDate(dbUser.updated_at),
      lastLoginAt: null,
      role: 'user',
      deletedAt: null,
      googleId: dbUser.google_id || null
    };
  }

  /**
   * Parse numeric fields that might come as strings from database
   * @param value The value to parse
   * @param defaultValue Default value if parsing fails
   * @returns Parsed number
   */
  private static parseNumericField(value: any, defaultValue: number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  }

  /**
   * Format date to ISO8601 string
   * @param date Date value from database
   * @returns ISO8601 formatted string or null
   */
  private static formatDate(date: any): string | null {
    if (!date) return null;
    
    try {
      // Handle various date formats
      if (date instanceof Date) {
        return date.toISOString();
      }
      
      // If it's a string, try to parse and reformat
      if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString();
      }
      
      // For numeric timestamps
      if (typeof date === 'number') {
        return new Date(date).toISOString();
      }
      
      return null;
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  }

  /**
   * Parse bias profile JSON
   * @param biasProfile JSON string or object from database
   * @returns Parsed bias profile or null
   */
  private static parseBiasProfile(biasProfile: any): any {
    if (!biasProfile) return null;
    
    try {
      let parsed: any;
      
      if (typeof biasProfile === 'string') {
        parsed = JSON.parse(biasProfile);
      } else if (typeof biasProfile === 'object') {
        parsed = biasProfile;
      } else {
        return null;
      }
      
      // Transform snake_case to camelCase
      return {
        initialAssessmentScore: this.parseNumericField(parsed.initial_assessment_score, 0),
        politicalLean: this.parseNumericField(parsed.political_lean, 0),
        preferredSources: Array.isArray(parsed.preferred_sources) ? parsed.preferred_sources : [],
        blindSpots: Array.isArray(parsed.blind_spots) ? parsed.blind_spots : [],
        assessmentDate: this.formatDate(parsed.assessment_date)
      };
    } catch (error) {
      console.error('Bias profile parsing error:', error);
      return null;
    }
  }

  /**
   * Transform an array of users
   * @param dbUsers Array of database user records
   * @returns Array of transformed users
   */
  static transformUsersForAPI(dbUsers: User[]): UserResponse[] {
    return dbUsers.map(user => this.transformUserForAPI(user)).filter(Boolean) as UserResponse[];
  }

  /**
   * Remove sensitive fields before sending to client
   * @param user Transformed user
   * @returns User without sensitive fields
   */
  static removeSensitiveFields(user: UserResponse): Partial<UserResponse> {
    const { ...safeUser } = user;
    // Remove any fields that shouldn't be sent to client
    // (password_hash is already not included in UserResponse)
    return safeUser;
  }
} 