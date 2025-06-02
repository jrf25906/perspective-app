import { IChallengeService } from '../interfaces/IChallengeService';
import { IAdaptiveChallengeService } from '../interfaces/IAdaptiveChallengeService';
import { IChallengeRepository } from '../interfaces/IChallengeRepository';
import { IXPService } from '../interfaces/IXPService';
import { IStreakService } from '../interfaces/IStreakService';
import { ILeaderboardService } from '../interfaces/ILeaderboardService';
import { IChallengeStatsService } from '../interfaces/IChallengeStatsService';
import { IChallengeAnswerService } from '../interfaces/IChallengeAnswerService';
import { IEchoScoreService } from '../services/echoScoreService';
import { IChallengeActivityRepository } from '../interfaces/IChallengeActivityRepository';
import { IAvatarService } from '../interfaces/IAvatarService';
import { IStorageService } from '../interfaces/IStorageService';

/**
 * Service container interface
 */
export interface ServiceContainer {
  challengeService: IChallengeService;
  adaptiveChallengeService: IAdaptiveChallengeService;
  challengeRepository: IChallengeRepository;
  xpService: IXPService;
  streakService: IStreakService;
  // Add more services as needed
}

/**
 * Service token type definition
 */
export interface ServiceToken<T> {
  readonly name: string;
  readonly _type?: T;
}

/**
 * Create a typed service token
 */
export function createServiceToken<T>(name: string): ServiceToken<T> {
  return { name };
}

/**
 * Type-safe service registry
 */
interface ServiceRegistry {
  [key: string]: {
    instance?: any;
    factory?: () => any;
  };
}

/**
 * Dependency Injection Container
 * Manages service instances and their dependencies
 */
export class DIContainer {
  private static instance: DIContainer;
  private registry: ServiceRegistry = {};

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Register a service factory
   */
  register<T>(token: ServiceToken<T>, factory: () => T): void {
    this.registry[token.name] = { factory };
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(token: ServiceToken<T>, instance: T): void {
    this.registry[token.name] = { instance };
  }

  /**
   * Get a service instance
   */
  get<T>(token: ServiceToken<T>): T {
    const registration = this.registry[token.name];
    if (!registration) {
      throw new Error(`Service not found: ${token.name}`);
    }

    // Return existing instance if available
    if (registration.instance) {
      return registration.instance;
    }

    // Create instance from factory
    if (registration.factory) {
      const instance = registration.factory();
      registration.instance = instance;
      return instance;
    }

    throw new Error(`Service not properly registered: ${token.name}`);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.registry = {};
  }
}

// Service tokens
export const ServiceTokens = {
  ChallengeService: createServiceToken<IChallengeService>('ChallengeService'),
  AdaptiveChallengeService: createServiceToken<IAdaptiveChallengeService>('AdaptiveChallengeService'),
  ChallengeRepository: createServiceToken<IChallengeRepository>('ChallengeRepository'),
  XPService: createServiceToken<IXPService>('XPService'),
  StreakService: createServiceToken<IStreakService>('StreakService'),
  LeaderboardService: createServiceToken<ILeaderboardService>('LeaderboardService'),
  ChallengeStatsService: createServiceToken<IChallengeStatsService>('ChallengeStatsService'),
  ChallengeAnswerService: createServiceToken<IChallengeAnswerService>('ChallengeAnswerService'),
  EchoScoreService: createServiceToken<IEchoScoreService>('EchoScoreService'),
  BiasRatingService: createServiceToken<any>('BiasRatingService'),
  ContentCurationService: createServiceToken<any>('ContentCurationService'),
  ContentIngestionScheduler: createServiceToken<any>('ContentIngestionScheduler'),
  NewsIntegrationService: createServiceToken<any>('NewsIntegrationService'),
  Database: createServiceToken<any>('Database'),
  ChallengeActivityRepository: createServiceToken<IChallengeActivityRepository>('ChallengeActivityRepository'),
  StorageService: createServiceToken<IStorageService>('StorageService'),
  AvatarService: createServiceToken<IAvatarService>('AvatarService')
} as const;

// Export singleton instance
export const container = DIContainer.getInstance(); 