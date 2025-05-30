import { IChallengeService } from '../interfaces/IChallengeService';
import { IAdaptiveChallengeService } from '../interfaces/IAdaptiveChallengeService';
import { IChallengeRepository } from '../interfaces/IChallengeRepository';
import { IXPService } from '../interfaces/IXPService';
import { IStreakService } from '../interfaces/IStreakService';

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
 * Dependency Injection Container
 * Manages service instances and their dependencies
 */
export class DIContainer {
  private static instance: DIContainer;
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

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
  register<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(token: string, instance: T): void {
    this.services.set(token, instance);
  }

  /**
   * Get a service instance
   */
  get<T>(token: string): T {
    // Check if we have a singleton instance
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    // Check if we have a factory
    if (this.factories.has(token)) {
      const instance = this.factories.get(token)!();
      // Cache the instance as a singleton
      this.services.set(token, instance);
      return instance;
    }

    throw new Error(`Service not found: ${token}`);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

// Service tokens
export const ServiceTokens = {
  ChallengeService: 'ChallengeService',
  AdaptiveChallengeService: 'AdaptiveChallengeService',
  ChallengeRepository: 'ChallengeRepository',
  XPService: 'XPService',
  StreakService: 'StreakService',
  LeaderboardService: 'LeaderboardService',
  ChallengeStatsService: 'ChallengeStatsService',
  ChallengeAnswerService: 'ChallengeAnswerService',
  Database: 'Database'
} as const;

// Export singleton instance
export const container = DIContainer.getInstance(); 