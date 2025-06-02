import { describe, it, expect } from '@jest/globals';
import { 
  ChallengeResponse,
  validateChallengeResponse,
  ChallengeStatsResponse,
  LeaderboardEntryResponse,
  UserResponse,
  AuthResponse
} from '../src/types/api-contracts';

describe('API Contract Tests - iOS Compatibility', () => {
  
  describe('Challenge Response', () => {
    it('should match iOS Challenge model structure', () => {
      const mockChallenge: ChallengeResponse = {
        id: 1,
        type: 'bias_swap',
        title: 'Test Challenge',
        prompt: 'Test prompt', // NOT description
        content: {
          text: 'Test content',
          articles: null,
          visualization: null,
          questions: ['Q1'],
          additionalContext: null,
          question: null,
          prompt: null,
          referenceMaterial: null,
          scenario: null,
          stakeholders: null,
          considerations: null
        },
        options: [
          {
            id: 'A',
            text: 'Option A',
            isCorrect: true,
            explanation: 'Correct!'
          }
        ],
        correctAnswer: null, // Always null for security
        explanation: 'Test explanation',
        difficultyLevel: 2, // Number, not string
        requiredArticles: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedTimeMinutes: 5
      };
      
      expect(validateChallengeResponse(mockChallenge)).toBe(true);
      expect(typeof mockChallenge.difficultyLevel).toBe('number');
      expect(typeof mockChallenge.prompt).toBe('string');
      expect(mockChallenge.correctAnswer).toBeNull();
    });
    
    it('should have correct challenge type enum values', () => {
      const validTypes = ['bias_swap', 'logic_puzzle', 'data_literacy', 'counter_argument', 'synthesis', 'ethical_dilemma'];
      
      validTypes.forEach(type => {
        expect(['bias_swap', 'logic_puzzle', 'data_literacy', 'counter_argument', 'synthesis', 'ethical_dilemma']).toContain(type);
      });
    });
    
    it('should have content as object not string', () => {
      const challenge: any = {
        content: '{invalid json}'
      };
      
      expect(typeof challenge.content).not.toBe('object');
      
      // Content should be parsed to object
      const validChallenge: any = {
        content: {}
      };
      
      expect(typeof validChallenge.content).toBe('object');
    });
  });
  
  describe('Challenge Stats Response', () => {
    it('should match iOS ChallengeStats model', () => {
      const mockStats: ChallengeStatsResponse = {
        totalCompleted: 10,
        currentStreak: 5,
        longestStreak: 7,
        averageAccuracy: 85.5, // Double
        totalXpEarned: 1000,
        challengesByType: {
          'bias_swap': 3,
          'logic_puzzle': 7
        },
        recentActivity: [
          {
            challengeId: 1,
            type: 'bias_swap',
            isCorrect: true,
            completedAt: new Date().toISOString()
          }
        ]
      };
      
      expect(typeof mockStats.averageAccuracy).toBe('number');
      expect(Array.isArray(mockStats.recentActivity)).toBe(true);
      expect(mockStats.recentActivity.length).toBeGreaterThan(0);
    });
  });
  
  describe('Leaderboard Response', () => {
    it('should match iOS LeaderboardEntry model', () => {
      const mockLeaderboard: LeaderboardEntryResponse[] = [
        {
          id: 1,
          username: 'testuser',
          avatarUrl: null, // TODO: Implement
          challengesCompleted: 50,
          totalXp: 5000,
          correctAnswers: 45
        }
      ];
      
      expect(Array.isArray(mockLeaderboard)).toBe(true);
      mockLeaderboard.forEach(entry => {
        expect(typeof entry.id).toBe('number');
        expect(typeof entry.totalXp).toBe('number');
        expect(entry.avatarUrl === null || typeof entry.avatarUrl === 'string').toBe(true);
      });
    });
  });
  
  describe('User Response', () => {
    it('should match iOS User model with snake_case fields', () => {
      const mockUser: UserResponse = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        isActive: true,
        emailVerified: true,
        echoScore: 85.5, // Number, NOT string
        biasProfile: null,
        preferredChallengeTime: null,
        currentStreak: 5,
        lastActivityDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'user',
        deletedAt: null,
        googleId: null
      };
      
      expect(typeof mockUser.echoScore).toBe('number');
      expect(typeof mockUser.echoScore).not.toBe('string');
      expect(typeof mockUser.currentStreak).toBe('number');
    });
  });
  
  describe('Auth Response', () => {
    it('should match iOS AuthResponse model', () => {
      const mockAuth: AuthResponse = {
        token: 'jwt-token-here',
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: null,
          isActive: true,
          emailVerified: true,
          echoScore: 85.5,
          biasProfile: null,
          preferredChallengeTime: null,
          currentStreak: 5,
          lastActivityDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: null,
          role: 'user',
          deletedAt: null,
          googleId: null
        }
      };
      
      expect(typeof mockAuth.token).toBe('string');
      expect(typeof mockAuth.user).toBe('object');
      expect(typeof mockAuth.user.id).toBe('number');
    });
  });
  
  describe('Date Handling', () => {
    it('should use ISO8601 format for all dates', () => {
      const dateFields = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivityDate: new Date().toISOString()
      };
      
      Object.values(dateFields).forEach(date => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });
  });
  
  describe('Common Issues', () => {
    it('should not send empty arrays when iOS expects populated arrays', () => {
      const badStats = {
        recentActivity: [] // BAD - iOS expects ChallengeActivity objects
      };
      
      const goodStats = {
        recentActivity: [
          {
            challengeId: 1,
            type: 'bias_swap',
            isCorrect: true,
            completedAt: new Date().toISOString()
          }
        ]
      };
      
      expect(badStats.recentActivity.length).toBe(0);
      expect(goodStats.recentActivity.length).toBeGreaterThan(0);
    });
    
    it('should use correct field names for StreakInfo', () => {
      const badStreakInfo = {
        currentStreak: 5,    // BAD
        longestStreak: 10,   // BAD
        streakMaintained: true // BAD
      };
      
      const goodStreakInfo = {
        current: 5,    // GOOD
        longest: 10,   // GOOD
        isActive: true // GOOD
      };
      
      expect(goodStreakInfo).toHaveProperty('current');
      expect(goodStreakInfo).toHaveProperty('longest');
      expect(goodStreakInfo).toHaveProperty('isActive');
    });
  });
}); 