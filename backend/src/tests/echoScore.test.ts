import { EchoScoreService, createEchoScoreService } from '../services/echoScoreService';
import db from '../db';

// Mock database for testing
jest.mock('../db');

describe('EchoScoreService', () => {
  let echoScoreService: any;
  const mockDb = db as jest.Mocked<typeof db>;

  // Helper function to create a mock query builder
  const createMockQueryBuilder = (resolvedValue: any) => ({
    where: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(resolvedValue),
    groupBy: jest.fn().mockReturnThis(),
    avg: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    raw: jest.fn().mockResolvedValue(resolvedValue)
  });

  beforeAll(() => {
    // Create service instance for tests
    echoScoreService = createEchoScoreService(mockDb);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateEchoScore', () => {
    it('should calculate echo score with all components', async () => {
      const mockUserId = 1;
      
      // Mock database queries for echo score calculation
      // Setup different responses based on table being queried
      (mockDb as any).mockImplementation((query: any) => {
        if (typeof query === 'string') {
          const tableName = query;
          
          if (tableName === 'article_interactions') {
            return createMockQueryBuilder([
              { source: 'CNN', bias_rating: -2 },
              { source: 'Fox News', bias_rating: 2 },
              { source: 'BBC', bias_rating: 0 },
              { source: 'NPR', bias_rating: -1 },
              { source: 'WSJ', bias_rating: 1 }
            ]);
          }
          
          if (tableName === 'challenge_submissions') {
            const builder = createMockQueryBuilder({ count: '50' });
            builder.select = jest.fn().mockResolvedValue([
              { is_correct: true, count: '40' },
              { is_correct: false, count: '10' }
            ]);
            return builder;
          }
          
          if (tableName === 'users') {
            return createMockQueryBuilder({
              id: mockUserId,
              created_at: new Date('2023-01-01')
            });
          }
          
          if (tableName === 'user_echo_scores') {
            const builder = createMockQueryBuilder({ avg_score: 72.5 });
            builder.select = jest.fn().mockResolvedValue([
              { total_score: 75, created_at: new Date() },
              { total_score: 70, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            ]);
            return builder;
          }
        }
        
        // For raw queries
        return {
          raw: jest.fn((sql: string) => sql)
        };
      });
      
      const score = await echoScoreService.calculateEchoScore(mockUserId);
      
      expect(score).toHaveProperty('total_score');
      expect(score).toHaveProperty('diversity_score');
      expect(score).toHaveProperty('accuracy_score');
      expect(score).toHaveProperty('switch_speed_score');
      expect(score).toHaveProperty('consistency_score');
      expect(score).toHaveProperty('improvement_score');
      
      // Scores should be between 0 and 100
      expect(score.total_score).toBeGreaterThanOrEqual(0);
      expect(score.total_score).toBeLessThanOrEqual(100);
    });

    it('should return 0 scores when user has no activity', async () => {
      // Mock empty results for all queries
      (mockDb as any).mockImplementation((query: any) => {
        if (typeof query === 'string') {
          return {
            where: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ count: '0' }),
            groupBy: jest.fn().mockReturnThis(),
            avg: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            raw: jest.fn().mockResolvedValue([])
          };
        }
        return {
          raw: jest.fn((sql: string) => sql)
        };
      });
      
      const score = await echoScoreService.calculateEchoScore(1);
      
      expect(score.diversity_score).toBe(0);
      expect(score.accuracy_score).toBe(0);
      // Note: switch_speed_score defaults to 50 when no data
      expect(score.switch_speed_score).toBe(50);
      expect(score.consistency_score).toBe(0);
      // Note: improvement_score defaults to 50 when insufficient data
      expect(score.improvement_score).toBe(50);
    });
  });

  describe('Score Components', () => {
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
    it('should return daily progress data', async () => {
      const progress = await echoScoreService.getScoreProgress(1, 'daily');
      
      expect(progress).toHaveProperty('period', 'daily');
      expect(progress).toHaveProperty('scores');
      expect(progress).toHaveProperty('trends');
      expect(progress.trends).toHaveProperty('total');
      expect(progress.trends).toHaveProperty('diversity');
      expect(progress.trends).toHaveProperty('accuracy');
      expect(progress.trends).toHaveProperty('switch_speed');
      expect(progress.trends).toHaveProperty('consistency');
      expect(progress.trends).toHaveProperty('improvement');
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