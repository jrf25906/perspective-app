# Refactoring TODO

## ✅ Completed Tasks

### 1. Interface Alignment
- Fixed AdaptiveChallengeService.analyzeUserProgress() return type
- Verified all other interfaces match implementations

### 2. Structured Logging Setup
- Created Winston logger utility with file and console output
- Applied to core system files (server, app, db)
- Added logs directory to .gitignore

### 3. Test Configuration
- Created Jest configuration for TypeScript
- Installed ts-jest
- Updated test imports to use source files

### 4. Request Validation
- Created validation middleware using Joi
- Applied to challenge routes as example
- Created reusable validation schemas

## 🚧 In Progress Tasks

### 1. Remove Singleton Exports (11 services affected)
```bash
# Run helper script to see current status
npm run ts-node src/scripts/refactor-helpers.ts
```

**Files to update:**
- challengeAnswerService.ts
- leaderboardService.ts
- contentCurationService.ts
- streakService.ts
- biasRatingService.ts
- xpService.ts
- newsIntegrationService.ts
- contentIngestionScheduler.ts
- challengeStatsService.ts
- adaptiveChallengeService.ts
- challengeRepository.ts

### 2. Complete Logger Migration (~50 occurrences)
Replace all console.log/error/warn with appropriate logger calls.

### 3. Apply Validation to Remaining Routes
- Auth routes
- User routes
- Content routes
- Admin routes

## 📋 Quick Reference

### Using the Logger
```typescript
import logger from '../utils/logger';
logger.info('Message');
logger.error('Error', error);
logger.warn('Warning');
```

### Using Validation
```typescript
import { validate } from '../middleware/validation';
router.post('/route', validate({ body: schema }), handler);
```

### Using DI Container
```typescript
import { container, ServiceTokens } from '../di/container';
const service = container.get(ServiceTokens.ServiceName);
```

## 🎯 Priority Order

1. **High**: Remove singleton exports (breaks DI pattern)
2. **Medium**: Complete logger migration (improves debugging)
3. **Low**: Add validation to all routes (enhances security)

See `REFACTORING_SUMMARY.md` for detailed documentation of all changes. 