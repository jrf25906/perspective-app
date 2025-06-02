import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';
import { ChallengeResponse, AuthResponse, UserResponse, validateChallengeResponse, validateAuthResponse, ChallengeStatsResponse, LeaderboardEntryResponse, ChallengeResultResponse } from '../types/api-contracts';
/**
 * Middleware to validate API responses match iOS expectations
 * Prevents runtime decoding errors in the iOS app
 */
export function validateApiResponse(req: Request, res: Response, next: NextFunction) {
    // Override res.json to validate responses
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
        const endpoint = req.originalUrl;
        try {
            // Validate based on endpoint
            if (endpoint.includes('/challenge/today')) {
                validateChallengeEndpoint(body, 'today');
            }
            else if (endpoint.includes('/challenge/stats')) {
                validateChallengeStatsEndpoint(body);
            }
            else if (endpoint.includes('/challenge/leaderboard')) {
                validateLeaderboardEndpoint(body);
            }
            else if (endpoint.includes('/challenge') && endpoint.includes('/submit')) {
                validateChallengeSubmitEndpoint(body);
            }
            else if (endpoint.includes('/auth/')) {
                validateAuthEndpoint(body);
            }
            else if (endpoint.includes('/profile/echo-score/history')) {
                validateEchoScoreHistoryEndpoint(body);
            }
            else if (endpoint.includes('/profile/echo-score')) {
                validateEchoScoreEndpoint(body);
            }
            else if (endpoint.includes('/profile')) {
                validateUserEndpoint(body);
            }
            // Log successful validation in development
            if (process.env.NODE_ENV === 'development') {
                logger.info(`✅ Response validation passed for ${endpoint}`);
            }
        }
        catch (error) {
            logger.error(`❌ Response validation failed for ${endpoint}:`, error);
            // In development, return validation error
            if (process.env.NODE_ENV === 'development') {
                return originalJson({
                    error: {
                        code: 'RESPONSE_VALIDATION_ERROR',
                        message: `Response does not match iOS contract: ${error.message}`,
                        endpoint,
                        validationError: error.message
                    }
                });
            }
        }
        return originalJson(body);
    };
    next();
}
function validateChallengeEndpoint(body: any, type: string) {
    if (body.error)
        return; // Skip error responses
    const errors: string[] = [];
    // Check required fields
    if (typeof body.id !== 'number')
        errors.push('id must be a number');
    if (!body.type || !isValidChallengeType(body.type))
        errors.push('type must be a valid challenge type');
    if (typeof body.title !== 'string')
        errors.push('title must be a string');
    if (typeof body.prompt !== 'string')
        errors.push('prompt must be a string');
    if (typeof body.content !== 'object')
        errors.push('content must be an object');
    if (typeof body.difficultyLevel !== 'number' || body.difficultyLevel < 1 || body.difficultyLevel > 4) {
        errors.push('difficultyLevel must be a number between 1-4');
    }
    if (typeof body.createdAt !== 'string')
        errors.push('createdAt must be an ISO8601 string');
    if (typeof body.updatedAt !== 'string')
        errors.push('updatedAt must be an ISO8601 string');
    // Validate content structure
    if (body.content && typeof body.content === 'object') {
        const contentFields = [
            'text', 'articles', 'visualization', 'questions',
            'additionalContext', 'question', 'prompt',
            'referenceMaterial', 'scenario', 'stakeholders', 'considerations'
        ];
        for (const field of contentFields) {
            if (body.content[field] !== null && body.content[field] !== undefined) {
                // Field exists, validate its type
                if (field === 'articles' && !Array.isArray(body.content[field])) {
                    errors.push(`content.${field} must be an array or null`);
                }
            }
        }
    }
    // Validate options if present
    if (body.options !== null && body.options !== undefined) {
        if (!Array.isArray(body.options)) {
            errors.push('options must be an array or null');
        }
        else {
            body.options.forEach((opt: any, i: number) => {
                if (typeof opt.id !== 'string')
                    errors.push(`options[${i}].id must be a string`);
                if (typeof opt.text !== 'string')
                    errors.push(`options[${i}].text must be a string`);
                if (typeof opt.isCorrect !== 'boolean')
                    errors.push(`options[${i}].isCorrect must be a boolean`);
            });
        }
    }
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}
function validateChallengeStatsEndpoint(body: any) {
    if (body.error)
        return;
    const errors: string[] = [];
    if (typeof body.totalCompleted !== 'number')
        errors.push('totalCompleted must be a number');
    if (typeof body.currentStreak !== 'number')
        errors.push('currentStreak must be a number');
    if (typeof body.longestStreak !== 'number')
        errors.push('longestStreak must be a number');
    if (typeof body.averageAccuracy !== 'number')
        errors.push('averageAccuracy must be a number');
    if (typeof body.totalXpEarned !== 'number')
        errors.push('totalXpEarned must be a number');
    if (typeof body.challengesByType !== 'object')
        errors.push('challengesByType must be an object');
    if (!Array.isArray(body.recentActivity)) {
        errors.push('recentActivity must be an array');
    }
    else if (body.recentActivity.length === 0) {
        logger.warn('⚠️ recentActivity is empty - iOS expects ChallengeActivity objects');
    }
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}
function validateLeaderboardEndpoint(body: any) {
    if (body.error)
        return;
    if (!Array.isArray(body)) {
        throw new Error('Leaderboard response must be an array');
    }
    body.forEach((entry: any, i: number) => {
        const errors: string[] = [];
        if (typeof entry.id !== 'number')
            errors.push(`[${i}].id must be a number`);
        if (typeof entry.username !== 'string')
            errors.push(`[${i}].username must be a string`);
        if (typeof entry.challengesCompleted !== 'number')
            errors.push(`[${i}].challengesCompleted must be a number`);
        if (typeof entry.totalXp !== 'number')
            errors.push(`[${i}].totalXp must be a number`);
        if (typeof entry.correctAnswers !== 'number')
            errors.push(`[${i}].correctAnswers must be a number`);
        if (entry.avatarUrl === null) {
            logger.warn(`⚠️ Leaderboard entry[${i}].avatarUrl is null - TODO: implement avatars`);
        }
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    });
}
function validateChallengeSubmitEndpoint(body: any) {
    if (body.error)
        return;
    const errors: string[] = [];
    if (typeof body.isCorrect !== 'boolean')
        errors.push('isCorrect must be a boolean');
    if (typeof body.feedback !== 'string')
        errors.push('feedback must be a string');
    if (typeof body.xpEarned !== 'number')
        errors.push('xpEarned must be a number');
    if (!body.streakInfo || typeof body.streakInfo !== 'object') {
        errors.push('streakInfo must be an object');
    }
    else {
        if (typeof body.streakInfo.current !== 'number')
            errors.push('streakInfo.current must be a number');
        if (typeof body.streakInfo.longest !== 'number')
            errors.push('streakInfo.longest must be a number');
        if (typeof body.streakInfo.isActive !== 'boolean')
            errors.push('streakInfo.isActive must be a boolean');
    }
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}
function validateAuthEndpoint(body: any) {
    if (body.error)
        return;
    const errors: string[] = [];
    if (typeof body.token !== 'string')
        errors.push('token must be a string');
    if (!body.user || typeof body.user !== 'object') {
        errors.push('user must be an object');
    }
    else {
        validateUserObject(body.user, errors);
    }
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}
function validateUserEndpoint(body: any) {
    if (body.error)
        return;
    const errors: string[] = [];
    validateUserObject(body, errors);
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}
function validateUserObject(user: any, errors: string[]) {
    if (typeof user.id !== 'number')
        errors.push('user.id must be a number');
    if (typeof user.email !== 'string')
        errors.push('user.email must be a string');
    if (typeof user.username !== 'string')
        errors.push('user.username must be a string');
    if (typeof user.echoScore !== 'number')
        errors.push('user.echoScore must be a number, not string');
    if (typeof user.currentStreak !== 'number')
        errors.push('user.currentStreak must be a number');
    if (typeof user.createdAt !== 'string')
        errors.push('user.createdAt must be an ISO8601 string');
    if (typeof user.updatedAt !== 'string')
        errors.push('user.updatedAt must be an ISO8601 string');
    // Check for proper camelCase fields
    const requiredCamelCase = {
        firstName: 'first_name',
        lastName: 'last_name',
        avatarUrl: 'avatar_url',
        isActive: 'is_active',
        emailVerified: 'email_verified',
        echoScore: 'echo_score',
        biasProfile: 'bias_profile',
        preferredChallengeTime: 'preferred_challenge_time',
        currentStreak: 'current_streak',
        lastActivityDate: 'last_activity_date',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        lastLoginAt: 'last_login_at',
        googleId: 'google_id'
    };
    // Ensure camelCase fields exist and snake_case don't
    for (const [camelCase, snakeCase] of Object.entries(requiredCamelCase)) {
        if (snakeCase in user) {
            errors.push(`user contains snake_case field '${snakeCase}' - should be '${camelCase}'`);
        }
    }
}
function validateEchoScoreEndpoint(body: any) {
    if (body.error)
        return; // Skip error responses
    const errors: string[] = [];
    // Validate echo score structure based on iOS EchoScore model
    if (typeof body.id !== 'number')
        errors.push('id must be a number');
    if (typeof body.userId !== 'number')
        errors.push('userId must be a number');
    if (typeof body.totalScore !== 'number')
        errors.push('totalScore must be a number');
    if (typeof body.diversityScore !== 'number')
        errors.push('diversityScore must be a number');
    if (typeof body.accuracyScore !== 'number')
        errors.push('accuracyScore must be a number');
    if (typeof body.switchSpeedScore !== 'number')
        errors.push('switchSpeedScore must be a number');
    if (typeof body.consistencyScore !== 'number')
        errors.push('consistencyScore must be a number');
    if (typeof body.improvementScore !== 'number')
        errors.push('improvementScore must be a number');
    // Validate calculationDetails
    if (!body.calculationDetails || typeof body.calculationDetails !== 'object') {
        errors.push('calculationDetails must be an object');
    }
    else {
        const details = body.calculationDetails;
        if (typeof details.articlesRead !== 'number')
            errors.push('calculationDetails.articlesRead must be a number');
        if (typeof details.perspectivesExplored !== 'number')
            errors.push('calculationDetails.perspectivesExplored must be a number');
        if (typeof details.challengesCompleted !== 'number')
            errors.push('calculationDetails.challengesCompleted must be a number');
        if (typeof details.accurateAnswers !== 'number')
            errors.push('calculationDetails.accurateAnswers must be a number');
        if (typeof details.totalAnswers !== 'number')
            errors.push('calculationDetails.totalAnswers must be a number');
        if (typeof details.averageTimeSpent !== 'number')
            errors.push('calculationDetails.averageTimeSpent must be a number');
    }
    // Validate dates
    if (typeof body.scoreDate !== 'string')
        errors.push('scoreDate must be an ISO8601 string');
    if (typeof body.createdAt !== 'string')
        errors.push('createdAt must be an ISO8601 string');
    if (typeof body.updatedAt !== 'string')
        errors.push('updatedAt must be an ISO8601 string');
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}
function validateEchoScoreHistoryEndpoint(body: any) {
    if (body.error)
        return; // Skip error responses
    if (!Array.isArray(body)) {
        throw new Error('Echo score history must be an array');
    }
    // For now, just validate it's an array
    // We can add more detailed validation if needed
}
function isValidChallengeType(type: string): boolean {
    return ['bias_swap', 'logic_puzzle', 'data_literacy', 'counter_argument', 'synthesis', 'ethical_dilemma'].includes(type);
}
