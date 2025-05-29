import { EchoScoreService } from '../services/echoScoreService';
import db from '../db';

// Mock database for testing
jest.mock('../db');

describe('Echo Score Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateEchoScore', () => {
    it('should calculate Echo Score with all components', async () => {
      // Mock database responses
      (db as any).mockReturnValue({
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ active_days: 10 }),
        distinct: jest.fn().mockResolvedValue([])
      });

      const mockUserId = 1;
      const score = await EchoScoreService.calculateEchoScore(mockUserId);

      expect(score).toHaveProperty('total_score');
      expect(score).toHaveProperty('diversity_score');
      expect(score).toHaveProperty('accuracy_score');
      expect(score).toHaveProperty('switch_speed_score');
      expect(score).toHaveProperty('consistency_score');
      expect(score).toHaveProperty('improvement_score');
      expect(score.total_score).toBeGreaterThanOrEqual(0);
      expect(score.total_score).toBeLessThanOrEqual(100);
    });
  });

  describe('Score Components', () => {
    it('should return 0 for diversity score when no activity', async () => {
      (db as any).mockReturnValue({
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([])
      });

      const score = await EchoScoreService.calculateEchoScore(1);
      expect(score.diversity_score).toBe(0);
    });

    it('should calculate correct weights for total score', () => {
      const components = {
        diversity: 80,
        accuracy: 90,
        switch_speed: 70,
        consistency: 60,
        improvement: 75
      };

      const expectedTotal = 
        (components.diversity * 0.25) +
        (components.accuracy * 0.25) +
        (components.switch_speed * 0.20) +
        (components.consistency * 0.15) +
        (components.improvement * 0.15);

      expect(expectedTotal).toBeCloseTo(77.25, 1);
    });
  });

  describe('Progress Tracking', () => {
    it('should return daily progress with trends', async () => {
      const mockHistory = [
        {
          score_date: '2024-01-15',
          total_score: 75,
          diversity_score: 80,
          accuracy_score: 70,
          switch_speed_score: 75,
          consistency_score: 65,
          improvement_score: 80
        },
        {
          score_date: '2024-01-14',
          total_score: 73,
          diversity_score: 78,
          accuracy_score: 68,
          switch_speed_score: 73,
          consistency_score: 63,
          improvement_score: 78
        }
      ];

      (db as any).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockHistory)
      });

      const progress = await EchoScoreService.getScoreProgress(1, 'daily');
      
      expect(progress.period).toBe('daily');
      expect(progress.scores).toHaveLength(2);
      expect(progress.trends).toHaveProperty('total');
      expect(progress.trends.total).toBeGreaterThanOrEqual(-100);
      expect(progress.trends.total).toBeLessThanOrEqual(100);
    });
  });
});

// Test data generators for manual testing
export const generateTestData = {
  createUserActivity: (userId: number, days: number) => {
    const activities = [];
    const sources = ['CNN', 'Fox News', 'BBC', 'NPR', 'WSJ'];
    const biasRatings = [-3, -2, -1, 0, 1, 2, 3];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      activities.push({
        user_id: userId,
        article_id: Math.floor(Math.random() * 100) + 1,
        source: sources[Math.floor(Math.random() * sources.length)],
        bias_rating: biasRatings[Math.floor(Math.random() * biasRatings.length)],
        time_spent_seconds: Math.floor(Math.random() * 300) + 30,
        completion_percentage: Math.random() * 100,
        created_at: date
      });
    }
    
    return activities;
  },

  createUserResponses: (userId: number, count: number) => {
    const responses = [];
    
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(i / 3));
      
      responses.push({
        user_id: userId,
        challenge_id: Math.floor(Math.random() * 50) + 1,
        is_correct: Math.random() > 0.3, // 70% accuracy
        time_spent_seconds: Math.floor(Math.random() * 180) + 30,
        created_at: date
      });
    }
    
    return responses;
  }
}; 