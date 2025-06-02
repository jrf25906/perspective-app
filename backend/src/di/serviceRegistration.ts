import { container, ServiceTokens, ServiceToken } from './container';
import db from '../db';
import { createChallengeService } from '../services/challengeService';
import { createAdaptiveChallengeService } from '../services/adaptiveChallengeService';
import { createChallengeRepository } from '../services/challengeRepository';
import { createChallengeAnswerService } from '../services/challengeAnswerService';
import { createXPService } from '../services/xpService';
import { createStreakService } from '../services/streakService';
import { createLeaderboardService } from '../services/leaderboardService';
import { createChallengeStatsService } from '../services/challengeStatsService';
import { createEchoScoreService } from '../services/echoScoreService';
import { createBiasRatingService } from '../services/biasRatingService';
import { createContentCurationService } from '../services/contentCurationService';
import { createContentIngestionScheduler } from '../services/contentIngestionScheduler';
import { createNewsIntegrationService } from '../services/newsIntegrationService';
import { createChallengeActivityRepository } from '../services/challengeActivityRepository';
import { createStorageService } from '../services/storage/storageFactory';
import { createAvatarService } from '../services/avatarService';

/**
 * Register all services in the DI container
 * This function should be called once during application startup
 */
export function registerServices(): void {
  // Register database
  container.registerSingleton(ServiceTokens.Database, db);

  // Register repositories
  container.register(ServiceTokens.ChallengeRepository, () => createChallengeRepository());
  container.register(ServiceTokens.ChallengeActivityRepository, () => 
    createChallengeActivityRepository(container.get(ServiceTokens.Database))
  );

  // Register storage service
  container.register(ServiceTokens.StorageService, () => createStorageService());

  // Register avatar service
  container.register(ServiceTokens.AvatarService, () => 
    createAvatarService(
      container.get(ServiceTokens.Database),
      container.get(ServiceTokens.StorageService)
    )
  );

  // Register services
  container.register(ServiceTokens.AdaptiveChallengeService, () => createAdaptiveChallengeService());
  container.register(ServiceTokens.ChallengeAnswerService, () => createChallengeAnswerService());
  container.register(ServiceTokens.XPService, () => createXPService());
  container.register(ServiceTokens.StreakService, () => createStreakService());
  container.register(ServiceTokens.LeaderboardService, () => createLeaderboardService());
  container.register(ServiceTokens.ChallengeStatsService, () => createChallengeStatsService());

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

  // Register EchoScoreService
  container.register(ServiceTokens.EchoScoreService, () => {
    return createEchoScoreService(container.get(ServiceTokens.Database));
  });
  // Register additional services
  container.register(ServiceTokens.BiasRatingService, () => createBiasRatingService());
  container.register(ServiceTokens.ContentCurationService, () => createContentCurationService());
  container.register(ServiceTokens.ContentIngestionScheduler, () => createContentIngestionScheduler());
  container.register(ServiceTokens.NewsIntegrationService, () => createNewsIntegrationService());
}

/**
 * Get a service from the container
 * @param token Service token
 * @returns Service instance
 */
export function getService<T>(token: ServiceToken<T>): T {
  return container.get(token);
}