import { IEchoScoreService, createEchoScoreService } from './echoScoreService';
import logger from '../utils/logger';
import db from '../db';
import { processWithErrors, chunk } from '../utils/concurrentProcessing';

export class EchoScoreScheduler {
  private static echoScoreService: IEchoScoreService;

  private static getEchoScoreService(): IEchoScoreService {
    if (!this.echoScoreService) {
      this.echoScoreService = createEchoScoreService(db);
    }
    return this.echoScoreService;
  }

  /**
   * Calculate Echo Score after user completes a challenge
   */
  static async calculateAfterChallenge(userId: number, challengeId: number) {
    try {
      // Check if user has completed enough activities today to warrant a new calculation
      const today = new Date().toISOString().split('T')[0];
      const todayScores = await db('echo_score_history')
        .where('user_id', userId)
        .where('score_date', today)
        .count('* as count')
        .first();

      // Limit to one calculation per day to avoid excessive calculations
      if (todayScores && Number(todayScores.count) > 0) {
        logger.info(`Echo Score already calculated today for user ${userId}`);
        return;
      }

      // Check if user has completed at least 3 challenges today
      const todayResponses = await db('user_responses')
        .where('user_id', userId)
        .where('created_at', '>=', new Date(today))
        .count('* as count')
        .first();

      if (todayResponses && Number(todayResponses.count) >= 3) {
        logger.info(`Calculating Echo Score for user ${userId} after ${todayResponses.count} challenges`);
        const echoScoreService = this.getEchoScoreService();
        await echoScoreService.calculateAndSaveEchoScore(userId);
      }
    } catch (error) {
      logger.error(`Error in Echo Score calculation after challenge:`, error);
    }
  }

  /**
   * Calculate Echo Score after user reads an article
   */
  static async calculateAfterReading(userId: number, articleId: number) {
    try {
      // Check if user has read articles from at least 3 different sources today
      const today = new Date().toISOString().split('T')[0];
      
      const todaySources = await db('user_reading_activity')
        .join('news_articles', 'user_reading_activity.article_id', 'news_articles.id')
        .where('user_reading_activity.user_id', userId)
        .where('user_reading_activity.created_at', '>=', new Date(today))
        .select('news_articles.source')
        .distinct('news_articles.source');

      if (todaySources.length >= 3) {
        // Check if score was already calculated today
        const todayScores = await db('echo_score_history')
          .where('user_id', userId)
          .where('score_date', today)
          .count('* as count')
          .first();

        if (todayScores && Number(todayScores.count) === 0) {
          logger.info(`Calculating Echo Score for user ${userId} after reading from ${todaySources.length} sources`);
          const echoScoreService = this.getEchoScoreService();
          await echoScoreService.calculateAndSaveEchoScore(userId);
        }
      }
    } catch (error) {
      logger.error(`Error in Echo Score calculation after reading:`, error);
    }
  }

  /**
   * Daily Echo Score calculation for active users
   * This should be run as a cron job at the end of each day
   */
  static async calculateDailyScores() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Find users who were active yesterday but don't have a score
      const activeUsers = await db('user_sessions')
        .select('user_id')
        .distinct('user_id')
        .where('session_start', '>=', yesterday)
        .where('session_start', '<', new Date())
        .whereNotIn('user_id', function() {
          this.select('user_id')
            .from('echo_score_history')
            .where('score_date', yesterdayStr);
        });

      logger.info(`Found ${activeUsers.length} active users without Echo Score for ${yesterdayStr}`);

      // Calculate scores concurrently with error handling
      const echoScoreService = this.getEchoScoreService();
      
      const results = await processWithErrors(
        activeUsers,
        async (user) => {
          await echoScoreService.calculateAndSaveEchoScore(user.user_id);
          logger.info(`Calculated Echo Score for user ${user.user_id}`);
          return user.user_id;
        },
        {
          concurrencyLimit: 10, // Process 10 users concurrently to avoid DB overload
          continueOnError: true,
          onError: (error, user) => {
            logger.error(`Failed to calculate Echo Score for user ${user.user_id}:`, error.message);
          }
        }
      );

      return {
        processed: results.successful.length,
        failed: results.failed.length,
        date: yesterdayStr,
        failedUsers: results.failed.map(f => f.item.user_id)
      };
    } catch (error) {
      logger.error('Error in daily Echo Score calculation:', error);
      throw error;
    }
  }

  /**
   * Calculate weekly summary scores
   * This provides a more stable score for weekly reports
   */
  static async calculateWeeklySummary(userId: number) {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyScores = await db('echo_score_history')
        .where('user_id', userId)
        .where('score_date', '>=', weekAgo.toISOString().split('T')[0])
        .select('total_score', 'diversity_score', 'accuracy_score', 'switch_speed_score', 'consistency_score', 'improvement_score');

      if (weeklyScores.length === 0) {
        return null;
      }

      // Calculate average scores for the week
      const avgScores = weeklyScores.reduce((acc, score) => {
        acc.total += score.total_score;
        acc.diversity += score.diversity_score;
        acc.accuracy += score.accuracy_score;
        acc.switch_speed += score.switch_speed_score;
        acc.consistency += score.consistency_score;
        acc.improvement += score.improvement_score;
        return acc;
      }, {
        total: 0,
        diversity: 0,
        accuracy: 0,
        switch_speed: 0,
        consistency: 0,
        improvement: 0
      });

      const count = weeklyScores.length;
      return {
        period: 'weekly',
        scores_count: count,
        average_total: avgScores.total / count,
        average_diversity: avgScores.diversity / count,
        average_accuracy: avgScores.accuracy / count,
        average_switch_speed: avgScores.switch_speed / count,
        average_consistency: avgScores.consistency / count,
        average_improvement: avgScores.improvement / count,
        calculated_at: new Date()
      };
    } catch (error) {
      logger.error('Error calculating weekly summary:', error);
      throw error;
    }
  }
} 