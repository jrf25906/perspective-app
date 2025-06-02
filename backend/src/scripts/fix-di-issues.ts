import logger from '../utils/logger';
import { promises as fs } from 'fs';
import * as path from 'path';
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};
// Services that need factory functions
const servicesNeedingFactories = [
    'challengeRepository',
    'challengeAnswerService',
    'xpService',
    'streakService',
    'leaderboardService',
    'challengeStatsService',
    'biasRatingService',
    'contentCurationService',
    'contentIngestionScheduler',
    'newsIntegrationService'
];
async function addFactoryFunction(serviceName: string): Promise<boolean> {
    const fileName = `${serviceName}.ts`;
    const filePath = path.join(__dirname, '..', 'services', fileName);
    try {
        let content = await fs.readFile(filePath, 'utf8');
        // Check if factory function already exists
        if (content.includes(`export function create`)) {
            logger.info(`  ${colors.yellow}⚠${colors.reset} Factory function already exists in ${fileName}`);
            return false;
        }
        // Find the class name
        const classMatch = content.match(/export class (\w+)/);
        if (!classMatch) {
            logger.info(`  ${colors.red}✗${colors.reset} Could not find class in ${fileName}`);
            return false;
        }
        const className = classMatch[1];
        // Add factory function at the end
        const factoryFunction = `
// Factory function for DI
export function create${className}(): ${className} {
  return new ${className}();
}`;
        // Add before the last closing brace or at the end
        content = content.trimEnd() + '\n' + factoryFunction;
        await fs.writeFile(filePath, content);
        logger.info(`  ${colors.green}✓${colors.reset} Added factory function to ${fileName}`);
        return true;
    }
    catch (error) {
        logger.info(`  ${colors.red}✗${colors.reset} Error processing ${fileName}:`, error.message);
        return false;
    }
}
async function updateServiceRegistration(): Promise<void> {
    const filePath = path.join(__dirname, '..', 'di', 'serviceRegistration.ts');
    const newContent = `import { container, ServiceTokens, ServiceToken } from './container';
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

/**
 * Register all services in the DI container
 * This function should be called once during application startup
 */
export function registerServices(): void {
  // Register database
  container.registerSingleton(ServiceTokens.Database, db);

  // Register repositories
  container.register(ServiceTokens.ChallengeRepository, () => createChallengeRepository());

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
}

/**
 * Get a service from the container
 * @param token Service token
 * @returns Service instance
 */
export function getService<T>(token: ServiceToken<T>): T {
  return container.get(token);
}`;
    await fs.writeFile(filePath, newContent);
    logger.info(`${colors.green}✓ Updated service registration${colors.reset}`);
}
async function fixAutoRefactorScript(): Promise<void> {
    const filePath = path.join(__dirname, 'auto-refactor.ts');
    let content = await fs.readFile(filePath, 'utf8');
    // Add logger import at the top
    if (!content.includes("import logger")) {
        const imports = `import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import logger from '../utils/logger';`;
        content = content.replace(/import { promises as fs } from 'fs';\nimport \* as path from 'path';\nimport { glob } from 'glob';/, imports);
        await fs.writeFile(filePath, content);
        logger.info(`${colors.green}✓ Fixed auto-refactor.ts logger import${colors.reset}`);
    }
}
async function main() {
    logger.info(`${colors.blue}=== Fixing DI Issues ===${colors.reset}\n`);
    // Step 1: Add factory functions to services
    logger.info(`${colors.yellow}Step 1: Adding factory functions to services...${colors.reset}`);
    let factoriesAdded = 0;
    for (const service of servicesNeedingFactories) {
        if (await addFactoryFunction(service)) {
            factoriesAdded++;
        }
    }
    logger.info(`${colors.green}Added ${factoriesAdded} factory functions${colors.reset}\n`);
    // Step 2: Update service registration
    logger.info(`${colors.yellow}Step 2: Updating service registration...${colors.reset}`);
    await updateServiceRegistration();
    logger.info('');
    // Step 3: Fix auto-refactor script
    logger.info(`${colors.yellow}Step 3: Fixing auto-refactor script...${colors.reset}`);
    await fixAutoRefactorScript();
    logger.info('');
    logger.info(`${colors.blue}=== Summary ===${colors.reset}`);
    logger.info(`${colors.green}✓ Added ${factoriesAdded} factory functions${colors.reset}`);
    logger.info(`${colors.green}✓ Updated service registration${colors.reset}`);
    logger.info(`${colors.green}✓ Fixed auto-refactor script${colors.reset}`);
    logger.info(`\n${colors.yellow}Next steps:${colors.reset}`);
    logger.info('1. Update route files to use DI container instead of direct imports');
    logger.info('2. Update other files that import services directly');
    logger.info('3. Run typecheck again to see remaining issues');
}
main().catch(console.error);
