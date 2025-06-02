import logger from '../utils/logger';
import { ChallengeResponse, ChallengeOption, ChallengeContent, ChallengeActivity } from '../types/api-contracts';
import { getService } from '../di/serviceRegistration';
import { ServiceTokens } from '../di/container';
/**
 * Service responsible for transforming challenge data from database format to API format
 * Follows Single Responsibility Principle - only handles challenge data transformation
 */
export class ChallengeTransformService {
    /**
     * Transform a database challenge record to match iOS API contract
     * @param dbChallenge Challenge record from database
     * @returns Transformed challenge matching ChallengeResponse interface
     */
    static transformChallengeForAPI(dbChallenge: any): ChallengeResponse | null {
        if (!dbChallenge)
            return null;
        // Map difficulty strings to numbers
        const difficultyMap: {
            [key: string]: number;
        } = {
            'beginner': 1,
            'intermediate': 2,
            'advanced': 3,
            'expert': 4
        };
        // Parse and normalize content
        const { content, options } = this.parseAndNormalizeContent(dbChallenge.content);
        return {
            id: dbChallenge.id,
            type: dbChallenge.type,
            title: dbChallenge.title || 'Untitled Challenge',
            prompt: dbChallenge.description || dbChallenge.prompt || 'No prompt available',
            content: content,
            options: options,
            correctAnswer: null, // Never expose to client
            explanation: dbChallenge.explanation || '',
            difficultyLevel: difficultyMap[dbChallenge.difficulty] || 1,
            requiredArticles: dbChallenge.required_articles || null,
            isActive: this.parseBoolean(dbChallenge.is_active, true),
            createdAt: this.formatDate(dbChallenge.created_at),
            updatedAt: this.formatDate(dbChallenge.updated_at),
            estimatedTimeMinutes: dbChallenge.estimated_time_minutes || 5
        };
    }
    /**
     * Parse and normalize challenge content, extracting options if present
     */
    private static parseAndNormalizeContent(rawContent: any): {
        content: ChallengeContent;
        options: ChallengeOption[] | null;
    } {
        let content: any = {};
        let options: ChallengeOption[] | null = null;
        // Parse content if it's a string
        if (typeof rawContent === 'string') {
            try {
                content = JSON.parse(rawContent);
            }
            catch (e) {
                logger.error('Failed to parse content JSON:', e);
                content = { text: rawContent };
            }
        }
        else if (rawContent && typeof rawContent === 'object') {
            content = { ...rawContent };
        }
        // Extract and transform options if they exist
        if (content.options && Array.isArray(content.options)) {
            options = this.transformOptions(content.options);
            // Remove options from content since iOS expects them at root level
            delete content.options;
        }
        // Normalize content structure
        const normalizedContent: ChallengeContent = {
            text: content.text || null,
            articles: content.articles || null,
            visualization: content.visualization || null,
            questions: content.questions || null,
            additionalContext: content.additionalContext || null,
            question: content.question || null,
            prompt: content.prompt || null,
            referenceMaterial: content.referenceMaterial || null,
            scenario: content.scenario || null,
            stakeholders: content.stakeholders || null,
            considerations: content.considerations || null
        };
        return { content: normalizedContent, options };
    }
    /**
     * Transform options array ensuring all fields have correct types
     */
    private static transformOptions(rawOptions: any[]): ChallengeOption[] {
        return rawOptions.map((opt, index) => ({
            id: opt.id || String.fromCharCode(65 + index), // A, B, C, D...
            text: String(opt.text || opt.label || ''),
            isCorrect: this.parseBoolean(opt.isCorrect || opt.is_correct, false),
            explanation: opt.explanation || null
        }));
    }
    /**
     * Parse various representations of boolean values
     * Handles: true/false, 1/0, "true"/"false", "1"/"0", "yes"/"no"
     */
    private static parseBoolean(value: any, defaultValue: boolean): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value !== 0;
        if (typeof value === 'string') {
            const normalized = value.toLowerCase().trim();
            return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
        }
        return defaultValue;
    }
    /**
     * Format date to ISO8601 string
     */
    private static formatDate(date: any): string {
        if (!date)
            return new Date().toISOString();
        try {
            if (date instanceof Date) {
                return date.toISOString();
            }
            if (typeof date === 'string') {
                const parsed = new Date(date);
                return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
            }
            if (typeof date === 'number') {
                return new Date(date).toISOString();
            }
            return new Date().toISOString();
        }
        catch (error) {
            logger.error('Date formatting error:', error);
            return new Date().toISOString();
        }
    }
    /**
     * Transform challenge result for API response
     */
    static transformChallengeResultForAPI(result: any): any {
        return {
            isCorrect: this.parseBoolean(result.isCorrect || result.is_correct, false),
            feedback: result.feedback || '',
            xpEarned: result.xpEarned || 0,
            streakInfo: {
                current: result.streakInfo?.currentStreak || result.streakInfo?.current || 0,
                longest: result.streakInfo?.longestStreak || result.streakInfo?.longest || 0,
                isActive: this.parseBoolean(result.streakInfo?.streakMaintained ||
                    result.streakInfo?.isActive ||
                    result.streakInfo?.is_active, false)
            }
        };
    }
    /**
     * Transform challenge stats for API response
     */
    static async transformChallengeStatsForAPI(stats: any, userId: number): Promise<any> {
        const averageAccuracy = stats.total_completed > 0
            ? (stats.total_correct / stats.total_completed) * 100
            : 0.0;
        const challengesByType: {
            [key: string]: number;
        } = {};
        if (stats.type_performance) {
            Object.keys(stats.type_performance).forEach(type => {
                challengesByType[type] = stats.type_performance[type].completed || 0;
            });
        }
        // Fetch recent activities using the repository
        const activityRepository = getService(ServiceTokens.ChallengeActivityRepository);
        const recentActivity = await activityRepository.getRecentActivities(userId, 10);
        return {
            totalCompleted: stats.total_completed || 0,
            currentStreak: stats.current_streak || 0,
            longestStreak: stats.longest_streak || 0,
            averageAccuracy: averageAccuracy,
            totalXpEarned: stats.total_xp_earned || 0,
            challengesByType: challengesByType,
            recentActivity: recentActivity
        };
    }
    /**
     * Transform leaderboard entry for API response
     */
    static transformLeaderboardEntryForAPI(entry: any): any {
        return {
            id: entry.userId || entry.id,
            username: entry.username || 'Unknown',
            avatarUrl: entry.avatarUrl || entry.avatar_url || null,
            challengesCompleted: entry.challengesCompleted || entry.challenges_completed || 0,
            totalXp: entry.score || entry.totalXp || entry.total_xp || 0,
            correctAnswers: entry.correctAnswers || entry.correct_answers ||
                Math.round((entry.accuracy / 100) * (entry.challengesCompleted || 0))
        };
    }
}
