#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import * as path from 'path';

async function fixAdminRoutes() {
  const filePath = path.join(__dirname, '..', 'routes', 'adminRoutes.ts');
  let content = await fs.readFile(filePath, 'utf8');
  
  // Replace imports with DI container
  content = content.replace(
    /import biasRatingService from '..\/services\/biasRatingService';\nimport contentCurationService from '..\/services\/contentCurationService';\nimport newsIntegrationService from '..\/services\/newsIntegrationService';\nimport contentIngestionScheduler from '..\/services\/contentIngestionScheduler';/,
    `import { container, ServiceTokens } from '../di/container';`
  );
  
  // Add getters at the top of the route handlers
  const serviceGetters = `
// Get services from DI container
const getBiasRatingService = () => container.get(ServiceTokens.BiasRatingService);
const getContentCurationService = () => container.get(ServiceTokens.ContentCurationService);
const getNewsIntegrationService = () => container.get(ServiceTokens.NewsIntegrationService);
const getContentIngestionScheduler = () => container.get(ServiceTokens.ContentIngestionScheduler);
`;
  
  // Insert after imports
  const importEndIndex = content.indexOf('const router = Router();');
  content = content.slice(0, importEndIndex) + serviceGetters + '\n' + content.slice(importEndIndex);
  
  // Replace service usages
  content = content.replace(/biasRatingService\./g, 'getBiasRatingService().');
  content = content.replace(/contentCurationService\./g, 'getContentCurationService().');
  content = content.replace(/newsIntegrationService\./g, 'getNewsIntegrationService().');
  content = content.replace(/contentIngestionScheduler\./g, 'getContentIngestionScheduler().');
  
  await fs.writeFile(filePath, content);
  console.log('✓ Fixed adminRoutes.ts');
}

async function fixContentRoutes() {
  const filePath = path.join(__dirname, '..', 'routes', 'contentRoutes.ts');
  let content = await fs.readFile(filePath, 'utf8');
  
  // Replace import with DI container
  content = content.replace(
    /import biasRatingService from '..\/services\/biasRatingService';/,
    `import { container, ServiceTokens } from '../di/container';`
  );
  
  // Add getter
  const serviceGetter = `
// Get services from DI container  
const getBiasRatingService = () => container.get(ServiceTokens.BiasRatingService);
`;
  
  // Insert after imports
  const importEndIndex = content.indexOf('const router = Router();');
  content = content.slice(0, importEndIndex) + serviceGetter + '\n' + content.slice(importEndIndex);
  
  // Replace service usage
  content = content.replace(/biasRatingService\./g, 'getBiasRatingService().');
  
  await fs.writeFile(filePath, content);
  console.log('✓ Fixed contentRoutes.ts');
}

async function fixTestScript() {
  const filePath = path.join(__dirname, '..', 'scripts', 'testAdaptiveChallenges.ts');
  let content = await fs.readFile(filePath, 'utf8');
  
  // Replace import
  content = content.replace(
    /import adaptiveChallengeService from '..\/services\/adaptiveChallengeService';/,
    `import { container, ServiceTokens } from '../di/container';
import { registerServices } from '../di/serviceRegistration';

// Initialize DI container
registerServices();
const adaptiveChallengeService = container.get(ServiceTokens.AdaptiveChallengeService);`
  );
  
  await fs.writeFile(filePath, content);
  console.log('✓ Fixed testAdaptiveChallenges.ts');
}

async function fixIngestionCli() {
  const filePath = path.join(__dirname, '..', 'scripts', 'ingestion-cli.ts');
  let content = await fs.readFile(filePath, 'utf8');
  
  // Replace import
  content = content.replace(
    /import contentIngestionScheduler from '..\/services\/contentIngestionScheduler';/,
    `import { container, ServiceTokens } from '../di/container';
import { registerServices } from '../di/serviceRegistration';

// Initialize DI container
registerServices();
const contentIngestionScheduler = container.get(ServiceTokens.ContentIngestionScheduler);`
  );
  
  await fs.writeFile(filePath, content);
  console.log('✓ Fixed ingestion-cli.ts');
}

async function fixSchedulerSetup() {
  const filePath = path.join(__dirname, '..', 'setup', 'scheduler.setup.ts');
  let content = await fs.readFile(filePath, 'utf8');
  
  // Replace import
  content = content.replace(
    /import contentIngestionScheduler from '..\/services\/contentIngestionScheduler';/,
    `import { container, ServiceTokens } from '../di/container';`
  );
  
  // Add getter
  content = content.replace(
    /export function setupSchedulers\(\): void {/,
    `export function setupSchedulers(): void {
  const contentIngestionScheduler = container.get(ServiceTokens.ContentIngestionScheduler);`
  );
  
  await fs.writeFile(filePath, content);
  console.log('✓ Fixed scheduler.setup.ts');
}

async function updateServiceRegistration() {
  const filePath = path.join(__dirname, '..', 'di', 'serviceRegistration.ts');
  let content = await fs.readFile(filePath, 'utf8');
  
  // Add new imports
  const newImports = `import { createBiasRatingService } from '../services/biasRatingService';
import { createContentCurationService } from '../services/contentCurationService';
import { createContentIngestionScheduler } from '../services/contentIngestionScheduler';
import { createNewsIntegrationService } from '../services/newsIntegrationService';`;
  
  // Insert imports after existing imports
  content = content.replace(
    /import { createEchoScoreService } from '..\/services\/echoScoreService';/,
    `import { createEchoScoreService } from '../services/echoScoreService';
${newImports}`
  );
  
  // Add registrations before the closing brace
  const newRegistrations = `
  // Register additional services
  container.register(ServiceTokens.BiasRatingService, () => createBiasRatingService());
  container.register(ServiceTokens.ContentCurationService, () => createContentCurationService());
  container.register(ServiceTokens.ContentIngestionScheduler, () => createContentIngestionScheduler());
  container.register(ServiceTokens.NewsIntegrationService, () => createNewsIntegrationService());`;
  
  content = content.replace(
    /  \/\/ Register EchoScoreService[\s\S]*?\n  \}\);/,
    `  // Register EchoScoreService
  container.register(ServiceTokens.EchoScoreService, () => {
    return createEchoScoreService(container.get(ServiceTokens.Database));
  });${newRegistrations}`
  );
  
  await fs.writeFile(filePath, content);
  console.log('✓ Updated service registration');
}

async function main() {
  console.log('=== Fixing Route Imports ===\n');
  
  await fixAdminRoutes();
  await fixContentRoutes();
  await fixTestScript();
  await fixIngestionCli();
  await fixSchedulerSetup();
  await updateServiceRegistration();
  
  console.log('\n✅ All route imports fixed!');
}

main().catch(console.error); 