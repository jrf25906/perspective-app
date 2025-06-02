import logger from '../utils/logger';
/**
 * Service responsible for transforming echo score data from database format to API format
 * Follows Single Responsibility Principle - only handles echo score data transformation
 */
export class EchoScoreTransformService {
    /**
     * Transform user data to echo score response format
     * @param user User record from database
     * @returns Transformed echo score matching iOS EchoScore model
     */
    static transformUserToEchoScore(user: any): any {
        if (!user)
            return null;
        // Ensure echo_score is a number
        const echoScoreValue = this.parseFloat(user.echo_score, 0.0);
        return {
            id: user.id,
            userId: user.id,
            totalScore: echoScoreValue,
            diversityScore: 0.0, // These will be calculated when we have more data
            accuracyScore: 0.0,
            switchSpeedScore: 0.0,
            consistencyScore: 0.0,
            improvementScore: 0.0,
            calculationDetails: {
                articlesRead: 0,
                perspectivesExplored: 0,
                challengesCompleted: 0,
                accurateAnswers: 0,
                totalAnswers: 0,
                averageTimeSpent: 0.0
            },
            scoreDate: this.formatDate(user.updated_at),
            createdAt: this.formatDate(user.created_at),
            updatedAt: this.formatDate(user.updated_at)
        };
    }
    /**
     * Transform echo score history records
     * @param history Array of echo score history records
     * @returns Transformed history for iOS
     */
    static transformEchoScoreHistory(history: any[]): any[] {
        if (!Array.isArray(history))
            return [];
        return history.map(record => ({
            id: record.id,
            userId: record.user_id,
            totalScore: this.parseFloat(record.total_score, 0.0),
            diversityScore: this.parseFloat(record.diversity_score, 0.0),
            accuracyScore: this.parseFloat(record.accuracy_score, 0.0),
            switchSpeedScore: this.parseFloat(record.switch_speed_score, 0.0),
            consistencyScore: this.parseFloat(record.consistency_score, 0.0),
            improvementScore: this.parseFloat(record.improvement_score, 0.0),
            calculationDetails: this.parseCalculationDetails(record.calculation_details),
            scoreDate: this.formatDate(record.score_date),
            createdAt: this.formatDate(record.created_at),
            updatedAt: this.formatDate(record.updated_at)
        }));
    }
    /**
     * Parse calculation details from JSON or object
     */
    private static parseCalculationDetails(details: any): any {
        if (!details) {
            return {
                articlesRead: 0,
                perspectivesExplored: 0,
                challengesCompleted: 0,
                accurateAnswers: 0,
                totalAnswers: 0,
                averageTimeSpent: 0.0
            };
        }
        // Parse JSON string if needed
        let parsedDetails = details;
        if (typeof details === 'string') {
            try {
                parsedDetails = JSON.parse(details);
            }
            catch (e) {
                logger.error('Failed to parse calculation details:', e);
                return this.parseCalculationDetails(null);
            }
        }
        return {
            articlesRead: this.parseInt(parsedDetails.articles_read || parsedDetails.articlesRead, 0),
            perspectivesExplored: this.parseInt(parsedDetails.perspectives_explored || parsedDetails.perspectivesExplored, 0),
            challengesCompleted: this.parseInt(parsedDetails.challenges_completed || parsedDetails.challengesCompleted, 0),
            accurateAnswers: this.parseInt(parsedDetails.accurate_answers || parsedDetails.accurateAnswers, 0),
            totalAnswers: this.parseInt(parsedDetails.total_answers || parsedDetails.totalAnswers, 0),
            averageTimeSpent: this.parseFloat(parsedDetails.average_time_spent || parsedDetails.averageTimeSpent, 0.0)
        };
    }
    /**
     * Safely parse float value
     */
    private static parseFloat(value: any, defaultValue: number): number {
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? defaultValue : parsed;
        }
        return defaultValue;
    }
    /**
     * Safely parse integer value
     */
    private static parseInt(value: any, defaultValue: number): number {
        if (typeof value === 'number')
            return Math.floor(value);
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? defaultValue : parsed;
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
}
