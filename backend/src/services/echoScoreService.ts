/**
 * Echo Score Service – calculates user's Echo Score (future)
 * Components: diversity, accuracy, switch-speed, consistency, improvement.
 */
import { EchoScore, EchoScoreCalculationDetails } from '../models/EchoScore';
import { UserResponse } from '../models/Challenge';
import { UserReadingActivity } from '../models/Activity';

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

  private static async calculateDiversityScore(userId: number): Promise<number> {
    // Get user's reading activity from last 7 days
    const recentActivity = await this.getUserReadingActivity(userId, 7);
    
    if (recentActivity.length === 0) return 0;

    // Calculate Gini index of bias ratings
    const biasRatings = recentActivity.map(activity => activity.article.bias_rating || 0);
    const giniIndex = this.calculateGiniIndex(biasRatings);
    
    // Convert Gini index to 0-100 score (higher diversity = higher score)
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
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  // Database query methods (to be implemented with actual DB calls)
  private static async getUserReadingActivity(userId: number, days: number): Promise<any[]> {
    // TODO: Implement database query
    return [];
  }

  private static async getUserResponses(userId: number, days: number): Promise<UserResponse[]> {
    // TODO: Implement database query
    return [];
  }

  private static async getSwitchingChallengeResponses(userId: number, days: number): Promise<UserResponse[]> {
    // TODO: Implement database query
    return [];
  }

  private static async getUserActivityDays(userId: number, days: number): Promise<number> {
    // TODO: Implement database query
    return 0;
  }

  private static async getUserResponsesWithDates(userId: number, days: number): Promise<UserResponse[]> {
    // TODO: Implement database query
    return [];
  }
}
