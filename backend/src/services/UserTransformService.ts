import logger from '../utils/logger';
import { User } from '../models/User';
import { UserStatsService } from './UserStatsService';
import { UserResponse } from '../types/api-contracts';

/**
 * Enhanced User model interface to include all needed fields
 * This extends the base User type with additional fields used in transformation
 */
interface ExtendedUser extends User {
    last_login_at?: Date | string | null;
    role?: string;
    deleted_at?: Date | string | null;
    google_id?: string | null;
}

/**
 * Service responsible for transforming user data from database format to API format
 * Follows Single Responsibility Principle - only handles user data transformation
 */
export interface APIUserResponse {
    id: number;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    emailVerified: boolean;
    echoScore: number;
    biasProfile: any | null;
    preferredChallengeTime: string | null;
    currentStreak: number;
    lastActivityDate: string | null;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    role: string;
    deletedAt: string | null;
    googleId: string | null;
    
    // CRITICAL FIXES: These were previously hardcoded or missing
    totalXpEarned: number;
    recentActivity: Array<{
        id: number;
        type: string;
        title: string;
        description: string;
        xpEarned?: number;
        timestamp: string;
        metadata?: any;
    }>;
    
    // Enhanced streak information
    streakInfo: {
        current: number;
        longest: number;
        isActive: boolean;
        lastActivityDate?: string;
    };
}

export class UserTransformService {
    /**
     * Transform a database user record to match iOS API contract
     * @param dbUser User record from database
     * @returns Transformed user matching UserResponse interface
     */
    static async transformUserForAPI(dbUser: ExtendedUser | undefined): Promise<APIUserResponse | null> {
        if (!dbUser)
            return null;
        try {
            logger.debug(`Transforming user ${dbUser.id} for API response`);
            
            // Get comprehensive user statistics (CRITICAL FIX)
            const userStats = await UserStatsService.getUserStats(dbUser.id);
            
            // Transform dates to ISO8601 format for iOS compatibility
            const transformedUser: APIUserResponse = {
                id: dbUser.id,
                email: dbUser.email,
                username: dbUser.username,
                firstName: dbUser.first_name || null,
                lastName: dbUser.last_name || null,
                avatarUrl: dbUser.avatar_url || null,
                isActive: Boolean(dbUser.is_active),
                emailVerified: Boolean(dbUser.email_verified),
                echoScore: this.ensureNumericEchoScore(dbUser.echo_score),
                biasProfile: this.parseBiasProfile(dbUser.bias_profile),
                preferredChallengeTime: dbUser.preferred_challenge_time || null,
                currentStreak: userStats.currentStreak,
                lastActivityDate: dbUser.last_activity_date ? 
                    new Date(dbUser.last_activity_date).toISOString() : null,
                createdAt: new Date(dbUser.created_at).toISOString(),
                updatedAt: new Date(dbUser.updated_at).toISOString(),
                lastLoginAt: dbUser.last_login_at ? 
                    new Date(dbUser.last_login_at).toISOString() : null,
                role: dbUser.role || 'user',
                deletedAt: dbUser.deleted_at ? 
                    new Date(dbUser.deleted_at).toISOString() : null,
                googleId: dbUser.google_id || null,
                totalXpEarned: userStats.totalXpEarned,
                recentActivity: userStats.recentActivity.map(activity => ({
                    id: activity.id,
                    type: activity.type,
                    title: activity.title,
                    description: activity.description,
                    xpEarned: activity.xpEarned,
                    timestamp: activity.timestamp.toISOString(),
                    metadata: activity.metadata
                })),
                streakInfo: {
                    current: userStats.streakInfo.current,
                    longest: userStats.streakInfo.longest,
                    isActive: userStats.streakInfo.isActive,
                    lastActivityDate: userStats.streakInfo.lastActivityDate?.toISOString()
                }
            };
            
            logger.debug(`Transformed user ${dbUser.id}:`, {
                hasRecentActivity: transformedUser.recentActivity.length > 0,
                totalXpEarned: transformedUser.totalXpEarned,
                currentStreak: transformedUser.currentStreak,
                echoScore: transformedUser.echoScore
            });
            
            return transformedUser;
        }
        catch (error) {
            logger.error(`Failed to transform user ${dbUser?.id || 'unknown'}:`, error);
            
            // Return basic transformation as fallback to prevent API failures
            return this.createFallbackTransform(dbUser);
        }
    }
    /**
     * Parse numeric fields that might come as strings from database
     * @param value The value to parse
     * @param defaultValue Default value if parsing fails
     * @returns Parsed number
     */
    private static parseNumericField(value: any, defaultValue: number): number {
        if (typeof value === 'number')
            return value;
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
        if (!date)
            return null;
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
        }
        catch (error) {
            logger.error('Date formatting error:', error);
            return null;
        }
    }
    /**
     * Parse bias profile JSON
     * @param biasProfile JSON string or object from database
     * @returns Parsed bias profile or null
     */
    private static parseBiasProfile(biasProfile: any): any {
        if (!biasProfile)
            return null;
        try {
            let parsed: any;
            if (typeof biasProfile === 'string') {
                parsed = JSON.parse(biasProfile);
            }
            else if (typeof biasProfile === 'object') {
                parsed = biasProfile;
            }
            else {
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
        }
        catch (error) {
            logger.error('Bias profile parsing error:', error);
            return null;
        }
    }
    /**
     * Transform an array of users - Fixed to handle async properly
     * @param dbUsers Array of database user records
     * @returns Array of transformed users
     */
    static async transformUsersForAPI(dbUsers: ExtendedUser[]): Promise<APIUserResponse[]> {
        const transformPromises = dbUsers.map(user => this.transformUserForAPI(user));
        const transformedUsers = await Promise.all(transformPromises);
        return transformedUsers.filter(Boolean) as APIUserResponse[];
    }
    /**
     * Remove sensitive fields before sending to client
     * @param user Transformed user
     * @returns User without sensitive fields
     */
    static removeSensitiveFields(user: APIUserResponse): Partial<APIUserResponse> {
        const { ...safeUser } = user;
        // Remove any fields that shouldn't be sent to client
        // (password_hash is already not included in UserResponse)
        return safeUser;
    }
    /**
     * CRITICAL FIX: Ensure echoScore is always a number, not string
     * iOS expects number type for echoScore field
     */
    private static ensureNumericEchoScore(echoScore: any): number {
        if (typeof echoScore === 'number') {
            return echoScore;
        }
        
        if (typeof echoScore === 'string') {
            const parsed = parseFloat(echoScore);
            return isNaN(parsed) ? 0 : parsed;
        }
        
        return 0; // Default fallback
    }
    /**
     * Create fallback transformation if stats calculation fails
     * Ensures API doesn't fail completely if stats service is unavailable
     */
    private static createFallbackTransform(user: ExtendedUser | undefined): APIUserResponse | null {
        if (!user) return null;
        
        try {
            logger.warn(`Creating fallback transform for user ${user.id}`);
            
            return {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.first_name || null,
                lastName: user.last_name || null,
                avatarUrl: user.avatar_url || null,
                isActive: Boolean(user.is_active),
                emailVerified: Boolean(user.email_verified),
                echoScore: this.ensureNumericEchoScore(user.echo_score),
                biasProfile: user.bias_profile || null,
                preferredChallengeTime: user.preferred_challenge_time || null,
                currentStreak: user.current_streak || 0,
                lastActivityDate: user.last_activity_date ? 
                    new Date(user.last_activity_date).toISOString() : null,
                createdAt: new Date(user.created_at).toISOString(),
                updatedAt: new Date(user.updated_at).toISOString(),
                lastLoginAt: user.last_login_at ? 
                    new Date(user.last_login_at).toISOString() : null,
                role: user.role || 'user',
                deletedAt: user.deleted_at ? 
                    new Date(user.deleted_at).toISOString() : null,
                googleId: user.google_id || null,
                
                // Fallback values to prevent API contract violations
                totalXpEarned: 0,
                recentActivity: [],
                streakInfo: {
                    current: user.current_streak || 0,
                    longest: 0,
                    isActive: false
                }
            };
            
        } catch (error) {
            logger.error(`Failed to create fallback transform for user ${user.id}:`, error);
            return null;
        }
    }
    /**
     * Quick transform for contexts where full stats aren't needed
     * Useful for lightweight API responses
     */
    static transformUserBasic(user: ExtendedUser): Omit<APIUserResponse, 'totalXpEarned' | 'recentActivity' | 'streakInfo'> | null {
        if (!user) return null;
        
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.first_name || null,
            lastName: user.last_name || null,
            avatarUrl: user.avatar_url || null,
            isActive: Boolean(user.is_active),
            emailVerified: Boolean(user.email_verified),
            echoScore: this.ensureNumericEchoScore(user.echo_score),
            biasProfile: user.bias_profile || null,
            preferredChallengeTime: user.preferred_challenge_time || null,
            currentStreak: user.current_streak || 0,
            lastActivityDate: user.last_activity_date ? 
                new Date(user.last_activity_date).toISOString() : null,
            createdAt: new Date(user.created_at).toISOString(),
            updatedAt: new Date(user.updated_at).toISOString(),
            lastLoginAt: user.last_login_at ? 
                new Date(user.last_login_at).toISOString() : null,
            role: user.role || 'user',
            deletedAt: user.deleted_at ? 
                new Date(user.deleted_at).toISOString() : null,
            googleId: user.google_id || null
        };
    }
}
