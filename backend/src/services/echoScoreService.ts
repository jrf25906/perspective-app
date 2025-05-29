/**
 * Echo Score Service – calculates user's Echo Score (future)
 * Components: diversity, accuracy, switch-speed, consistency, improvement.
 */
import { EchoScore, EchoScoreCalculationDetails, EchoScoreHistory } from '../models/EchoScore';
import db from '../db';

export class EchoScoreService {
  private static readonly WEIGHTS = {
    diversity: 0.25,
    accuracy: 0.25,
    switch_speed: 0.20,
    consistency: 0.15,
    improvement: 0.15
  };

  static async calculateEchoScore(userId: number): Promise<EchoScore> {
    const [diversity, accuracy, switchSpeed, consistency, improvement] = await Promise.all([
      this.calculateDiversityScore(userId),
      this.calculateAccuracyScore(userId),
      this.calculateSwitchSpeedScore(userId),
      this.calculateConsistencyScore(userId),
      this.calculateImprovementScore(userId)
    ]);

    const totalScore = (
      diversity * this.WEIGHTS.diversity +
      accuracy * this.WEIGHTS.accuracy +
      switchSpeed * this.WEIGHTS.switch_speed +
      consistency * this.WEIGHTS.consistency +
      improvement * this.WEIGHTS.improvement
    );

    return {
      total_score: Math.round(totalScore * 100) / 100,
      diversity_score: diversity,
      accuracy_score: accuracy,
      switch_speed_score: switchSpeed,
      consistency_score: consistency,
      improvement_score: improvement
    };
  }

  static async calculateAndSaveEchoScore(userId: number): Promise<EchoScoreHistory> {
    const score = await this.calculateEchoScore(userId);
    const calculationDetails = await this.getCalculationDetails(userId);

    // Save to history
    const [savedScore] = await db('echo_score_history')
      .insert({
        user_id: userId,
        total_score: score.total_score,
        diversity_score: score.diversity_score,
        accuracy_score: score.accuracy_score,
        switch_speed_score: score.switch_speed_score,
        consistency_score: score.consistency_score,
        improvement_score: score.improvement_score,
        calculation_details: JSON.stringify(calculationDetails),
        score_date: new Date().toISOString().split('T')[0],
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    // Update user's current score
    await db('users')
      .where('id', userId)
      .update({ echo_score: score.total_score });

    return savedScore;
  }

  static async getEchoScoreHistory(userId: number, days?: number): Promise<EchoScoreHistory[]> {
    let query = db('echo_score_history')
      .where('user_id', userId)
      .orderBy('score_date', 'desc');

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query = query.where('score_date', '>=', startDate.toISOString().split('T')[0]);
    }

    const scores = await query;
    
    // Parse JSON fields
    return scores.map(score => ({
      ...score,
      calculation_details: typeof score.calculation_details === 'string' 
        ? JSON.parse(score.calculation_details) 
        : score.calculation_details
    }));
  }

  static async getLatestEchoScore(userId: number): Promise<EchoScoreHistory | null> {
    const score = await db('echo_score_history')
      .where('user_id', userId)
      .orderBy('score_date', 'desc')
      .first();

    if (!score) return null;

    return {
      ...score,
      calculation_details: typeof score.calculation_details === 'string' 
        ? JSON.parse(score.calculation_details) 
        : score.calculation_details
    };
  }

  static async getScoreProgress(userId: number, period: 'daily' | 'weekly' = 'daily'): Promise<any> {
    const days = period === 'daily' ? 7 : 28;
    const history = await this.getEchoScoreHistory(userId, days);

    const progress = {
      period,
      scores: history.map(h => ({
        date: h.score_date,
        total: h.total_score,
        components: {
          diversity: h.diversity_score,
          accuracy: h.accuracy_score,
          switch_speed: h.switch_speed_score,
          consistency: h.consistency_score,
          improvement: h.improvement_score
        }
      })),
      trends: {
        total: this.calculateTrend(history.map(h => h.total_score)),
        diversity: this.calculateTrend(history.map(h => h.diversity_score)),
        accuracy: this.calculateTrend(history.map(h => h.accuracy_score)),
        switch_speed: this.calculateTrend(history.map(h => h.switch_speed_score)),
        consistency: this.calculateTrend(history.map(h => h.consistency_score)),
        improvement: this.calculateTrend(history.map(h => h.improvement_score))
      }
    };

    return progress;
  }

  private static async getCalculationDetails(userId: number): Promise<EchoScoreCalculationDetails> {
    const [
      diversityMetrics,
      accuracyMetrics,
      speedMetrics,
      consistencyMetrics,
      improvementMetrics
    ] = await Promise.all([
      this.getDiversityMetrics(userId),
      this.getAccuracyMetrics(userId),
      this.getSpeedMetrics(userId),
      this.getConsistencyMetrics(userId),
      this.getImprovementMetrics(userId)
    ]);

    return {
      diversity_metrics: diversityMetrics,
      accuracy_metrics: accuracyMetrics,
      speed_metrics: speedMetrics,
      consistency_metrics: consistencyMetrics,
      improvement_metrics: improvementMetrics
    };
  }

  private static async getDiversityMetrics(userId: number): Promise<any> {
    const articles = await db('user_reading_activity')
      .join('news_articles', 'user_reading_activity.article_id', 'news_articles.id')
      .where('user_reading_activity.user_id', userId)
      .where('user_reading_activity.created_at', '>=', db.raw("NOW() - INTERVAL '7 days'"))
      .select('news_articles.source', 'news_articles.bias_rating');

    const biasRatings = articles.map(a => a.bias_rating || 0);
    const sources = [...new Set(articles.map(a => a.source))];

    return {
      gini_index: this.calculateGiniIndex(biasRatings),
      sources_read: sources,
      bias_range: biasRatings.length > 0 
        ? Math.max(...biasRatings) - Math.min(...biasRatings)
        : 0
    };
  }

  private static async getAccuracyMetrics(userId: number): Promise<any> {
    const responses = await db('user_responses')
      .where('user_id', userId)
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '30 days'"))
      .select('is_correct');

    const correctCount = responses.filter(r => r.is_correct).length;
    const totalCount = responses.length;

    // Recent accuracy (last 7 days)
    const recentResponses = await db('user_responses')
      .where('user_id', userId)
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '7 days'"))
      .select('is_correct');

    const recentCorrect = recentResponses.filter(r => r.is_correct).length;

    return {
      correct_answers: correctCount,
      total_answers: totalCount,
      recent_accuracy: recentResponses.length > 0 
        ? (recentCorrect / recentResponses.length) * 100
        : 0
    };
  }

  private static async getSpeedMetrics(userId: number): Promise<any> {
    const responses = await db('user_responses')
      .join('challenges_v2', 'user_responses.challenge_id', 'challenges_v2.id')
      .where('user_responses.user_id', userId)
      .where('challenges_v2.type', 'bias_swap')
      .where('user_responses.created_at', '>=', db.raw("NOW() - INTERVAL '30 days'"))
      .select('user_responses.time_spent_seconds')
      .orderBy('user_responses.created_at', 'desc');

    const times = responses.map(r => r.time_spent_seconds).filter(t => t != null);
    const medianTime = times.length > 0 ? this.calculateMedian(times) : 0;

    // Calculate improvement trend
    const oldTimes = times.slice(Math.floor(times.length / 2));
    const newTimes = times.slice(0, Math.floor(times.length / 2));
    const oldMedian = oldTimes.length > 0 ? this.calculateMedian(oldTimes) : 0;
    const newMedian = newTimes.length > 0 ? this.calculateMedian(newTimes) : 0;
    const improvementTrend = oldMedian > 0 ? ((oldMedian - newMedian) / oldMedian) * 100 : 0;

    return {
      median_response_time: medianTime,
      improvement_trend: improvementTrend
    };
  }

  private static async getConsistencyMetrics(userId: number): Promise<any> {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const activeDaysResult = await db('user_sessions')
      .where('user_id', userId)
      .where('session_start', '>=', fourteenDaysAgo)
      .select(db.raw('COUNT(DISTINCT DATE(session_start)) as active_days'))
      .first() as unknown as { active_days: number } | undefined;

    const user = await db('users')
      .where('id', userId)
      .select('current_streak')
      .first();

    return {
      active_days: activeDaysResult?.active_days || 0,
      total_days: 14,
      streak_length: user?.current_streak || 0
    };
  }

  private static async getImprovementMetrics(userId: number): Promise<any> {
    const responses = await db('user_responses')
      .where('user_id', userId)
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '30 days'"))
      .orderBy('created_at', 'asc')
      .select('is_correct', 'time_spent_seconds', 'created_at');

    // Calculate accuracy slope
    const accuracyPoints = responses.map((r, i) => ({
      x: i,
      y: r.is_correct ? 1 : 0
    }));
    const accuracySlope = this.calculateTrendSlope(accuracyPoints);

    // Calculate speed slope (inverse of time for improvement)
    const speedPoints = responses
      .filter(r => r.time_spent_seconds != null)
      .map((r, i) => ({
        x: i,
        y: 1 / r.time_spent_seconds
      }));
    const speedSlope = speedPoints.length > 1 ? this.calculateTrendSlope(speedPoints) : 0;

    // Calculate diversity slope
    const diversityHistory = await db('echo_score_history')
      .where('user_id', userId)
      .where('score_date', '>=', db.raw("NOW() - INTERVAL '30 days'"))
      .orderBy('score_date', 'asc')
      .select('diversity_score');

    const diversityPoints = diversityHistory.map((h, i) => ({
      x: i,
      y: h.diversity_score
    }));
    const diversitySlope = diversityPoints.length > 1 ? this.calculateTrendSlope(diversityPoints) : 0;

    return {
      accuracy_slope: accuracySlope,
      speed_slope: speedSlope,
      diversity_slope: diversitySlope
    };
  }

  private static async calculateDiversityScore(userId: number): Promise<number> {
    // Get user's reading activity from last 7 days
    const recentActivity = await this.getUserReadingActivity(userId, 7);
    
    if (recentActivity.length === 0) return 0;

    // Calculate Gini index of bias ratings
    const biasRatings = recentActivity.map(activity => activity.bias_rating || 0);
    const giniIndex = this.calculateGiniIndex(biasRatings);
    
    // Convert Gini index to 0-100 score (higher diversity = higher score)
    // Note: Gini index ranges from 0 (perfect equality) to 1 (perfect inequality)
    // We want higher diversity (higher Gini) to result in higher score
    return Math.min(100, giniIndex * 100);
  }

  private static async calculateAccuracyScore(userId: number): Promise<number> {
    // Get recent responses (last 30 days)
    const recentResponses = await this.getUserResponses(userId, 30);
    
    if (recentResponses.length === 0) return 0;

    const correctCount = recentResponses.filter(r => r.is_correct).length;
    return (correctCount / recentResponses.length) * 100;
  }

  private static async calculateSwitchSpeedScore(userId: number): Promise<number> {
    // Get responses with perspective switching challenges
    const switchingResponses = await this.getSwitchingChallengeResponses(userId, 30);
    
    if (switchingResponses.length === 0) return 50; // Default score

    const medianTime = this.calculateMedian(
      switchingResponses.map(r => r.time_spent_seconds)
    );

    // Convert time to score (faster = higher score, with reasonable bounds)
    const maxTime = 300; // 5 minutes
    const minTime = 30;   // 30 seconds
    
    const normalizedTime = Math.max(minTime, Math.min(maxTime, medianTime));
    return ((maxTime - normalizedTime) / (maxTime - minTime)) * 100;
  }

  private static async calculateConsistencyScore(userId: number): Promise<number> {
    // Get user activity over last 14 days
    const activityDays = await this.getUserActivityDays(userId, 14);
    return (activityDays / 14) * 100;
  }

  private static async calculateImprovementScore(userId: number): Promise<number> {
    // Calculate slopes of accuracy and speed over 30-day window
    const responses = await this.getUserResponsesWithDates(userId, 30);
    
    if (responses.length < 5) return 50; // Default for insufficient data

    const accuracySlope = this.calculateTrendSlope(
      responses.map((r, i) => ({ x: i, y: r.is_correct ? 1 : 0 }))
    );
    
    const speedSlope = this.calculateTrendSlope(
      responses.map((r, i) => ({ x: i, y: 1 / r.time_spent_seconds }))
    );

    // Convert slopes to 0-100 score
    const improvementScore = Math.max(0, Math.min(100, 50 + (accuracySlope + speedSlope) * 25));
    return improvementScore;
  }

  private static calculateGiniIndex(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const n = sorted.length;
    let sum = 0;
    
    for (let i = 0; i < n; i++) {
      sum += (2 * (i + 1) - n - 1) * sorted[i];
    }
    
    const mean = sorted.reduce((a, b) => a + b, 0) / n;
    return sum / (n * n * mean);
  }

  private static calculateMedian(values: number[]): number {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private static calculateTrendSlope(points: { x: number; y: number }[]): number {
    if (points.length < 2) return 0;
    
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    
    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;
    
    return (n * sumXY - sumX * sumY) / denominator;
  }

  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const points = values.map((v, i) => ({ x: i, y: v }));
    return this.calculateTrendSlope(points);
  }

  // Database query methods implementation
  private static async getUserReadingActivity(userId: number, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db('user_reading_activity')
      .join('news_articles', 'user_reading_activity.article_id', 'news_articles.id')
      .where('user_reading_activity.user_id', userId)
      .where('user_reading_activity.created_at', '>=', startDate)
      .select('news_articles.*', 'user_reading_activity.time_spent_seconds', 'user_reading_activity.completion_percentage');
  }

  private static async getUserResponses(userId: number, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db('user_responses')
      .where('user_id', userId)
      .where('created_at', '>=', startDate)
      .select('*');
  }

  private static async getSwitchingChallengeResponses(userId: number, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db('user_responses')
      .join('challenges_v2', 'user_responses.challenge_id', 'challenges_v2.id')
      .where('user_responses.user_id', userId)
      .where('challenges_v2.type', 'bias_swap')
      .where('user_responses.created_at', '>=', startDate)
      .select('user_responses.*');
  }

  private static async getUserActivityDays(userId: number, days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db('user_sessions')
      .where('user_id', userId)
      .where('session_start', '>=', startDate)
      .select(db.raw('COUNT(DISTINCT DATE(session_start)) as active_days'))
      .first() as unknown as { active_days: number } | undefined;

    return result?.active_days || 0;
  }

  private static async getUserResponsesWithDates(userId: number, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db('user_responses')
      .where('user_id', userId)
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'asc')
      .select('*');
  }
}
