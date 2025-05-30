# Refactoring TODO

## Interface Mismatches

The following service implementations need to be updated to match their interfaces:

### 1. ChallengeRepository
- Missing method: `recordDailyChallengeSelection(userId: number, challengeId: number): Promise<void>`

### 2. AdaptiveChallengeService
- Return type mismatch in `analyzeUserProgress()`: 
  - Current returns `suggestedFocus` property
  - Interface expects `recommendedFocus` property
  - Current returns `ChallengeType[]` arrays
  - Interface expects `string[]` arrays

### 3. XPService
- Return type mismatch in `checkAndAwardAchievements()`:
  - Current returns `{ newAchievements: string[]; xpAwarded: number; }`
  - Interface expects `Promise<void>`

### 4. StreakService
- Missing methods:
  - `getUserStreakInfo`
  - `hasUserBeenActiveToday`

## Resolution Strategy

These mismatches should be resolved by either:
1. Updating the service implementations to match the interfaces, or
2. Updating the interfaces to match the current implementations

This should be done as a separate refactoring task to avoid breaking existing functionality. 