import { container, ServiceTokens } from './container';
import db from '../db';
import { createChallengeService } from '../services/challengeService';
import adaptiveChallengeService from '../services/adaptiveChallengeService';
import challengeRepository from '../services/challengeRepository';
import challengeAnswerService from '../services/challengeAnswerService';
import xpService from '../services/xpService';
import streakService from '../services/streakService';
import leaderboardService from '../services/leaderboardService';
import challengeStatsService from '../services/challengeStatsService';

/**
 * Register all services in the DI container
 * This function should be called once during application startup
 */
export function registerServices(): void {
  // Register database
  container.registerSingleton(ServiceTokens.Database, db);

  // Register repositories
  container.registerSingleton(ServiceTokens.ChallengeRepository, challengeRepository);

  // Register services as singletons (for now, using existing instances)
  container.registerSingleton(ServiceTokens.AdaptiveChallengeService, adaptiveChallengeService);
  container.registerSingleton(ServiceTokens.ChallengeAnswerService, challengeAnswerService);
  container.registerSingleton(ServiceTokens.XPService, xpService);
  container.registerSingleton(ServiceTokens.StreakService, streakService);
  container.registerSingleton(ServiceTokens.LeaderboardService, leaderboardService);
  container.registerSingleton(ServiceTokens.ChallengeStatsService, challengeStatsService);

  // Register ChallengeService with proper dependencies
  container.register(ServiceTokens.ChallengeService, () => {
    return createChallengeService(
      container.get(ServiceTokens.Database),
      container.get(ServiceTokens.AdaptiveChallengeService),
      container.get(ServiceTokens.ChallengeRepository),
      container.get(ServiceTokens.ChallengeAnswerService),
      container.get(ServiceTokens.XPService),
      container.get(ServiceTokens.StreakService),
      container.get(ServiceTokens.LeaderboardService),
      container.get(ServiceTokens.ChallengeStatsService)
    );
  });
}

/**
 * Get a service from the container
 * @param token Service token
 * @returns Service instance
 */
export function getService<T>(token: string): T {
  return container.get<T>(token);
} 