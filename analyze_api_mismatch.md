# API Response vs iOS Model Mismatch Analysis

## Overview
This document systematically analyzes all API endpoints and their response structures compared to iOS model expectations.

## Methodology
1. Extract all API endpoints from backend controllers
2. Map response structures from transformation functions
3. Compare with iOS model definitions
4. Identify mismatches and potential issues

## 1. Challenge API Endpoints

### GET /challenge/today
**Backend Response (after transformation):**
```typescript
{
  id: number,
  type: string, // Challenge type enum value
  title: string,
  prompt: string, // Mapped from description
  content: object, // Normalized content object
  options: array | null,
  correctAnswer: null, // Always null for security
  explanation: string,
  difficultyLevel: number, // 1-4, mapped from string
  requiredArticles: null,
  isActive: boolean,
  createdAt: string, // ISO8601 date
  updatedAt: string, // ISO8601 date
  estimatedTimeMinutes: number
}
```

**iOS Model Expectation:**
```swift
struct Challenge {
    let id: Int
    let type: ChallengeType // Enum with specific raw values
    let title: String
    let prompt: String
    let content: ChallengeContent
    let options: [ChallengeOption]?
    let correctAnswer: String?
    let explanation: String
    let difficultyLevel: Int
    let requiredArticles: [String]?
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    let estimatedTimeMinutes: Int
}
```

**Potential Issues:**
1. ✅ Fixed: `description` → `prompt` mapping
2. ✅ Fixed: `difficulty` string → `difficultyLevel` int
3. ✅ Fixed: Date formatting to ISO8601
4. ❓ `content` must be a valid ChallengeContent object
5. ❓ `options` array elements must match ChallengeOption structure

### POST /challenge/:id/submit
**Backend Response:**
```typescript
{
  isCorrect: boolean,
  feedback: string,
  xpEarned: number,
  streakInfo: {
    current: number,    // Mapped from currentStreak
    longest: number,    // Mapped from longestStreak
    isActive: boolean   // Mapped from streakMaintained
  }
}
```

**iOS Model:**
```swift
struct ChallengeResult {
    let isCorrect: Bool
    let feedback: String
    let xpEarned: Int
    let streakInfo: StreakInfo
}

struct StreakInfo {
    let current: Int
    let longest: Int
    let isActive: Bool
}
```

**Potential Issues:**
1. ✅ Fixed: StreakInfo field mapping

### GET /challenge/stats
**Backend Response:**
```typescript
{
  totalCompleted: number,
  currentStreak: number,
  longestStreak: number,
  averageAccuracy: number, // Calculated percentage
  totalXpEarned: number,
  challengesByType: { [type: string]: number },
  recentActivity: array // Empty, TODO
}
```

**iOS Model:**
```swift
struct ChallengeStats {
    let totalCompleted: Int
    let currentStreak: Int
    let longestStreak: Int
    let averageAccuracy: Double
    let totalXpEarned: Int
    let challengesByType: [String: Int]
    let recentActivity: [ChallengeActivity]
}
```

**Potential Issues:**
1. ❌ `recentActivity` is always empty array - iOS expects ChallengeActivity objects

### GET /challenge/leaderboard
**Backend Response:**
```typescript
{
  id: number,          // userId
  username: string,
  avatarUrl: null,     // Always null, TODO
  challengesCompleted: number,
  totalXp: number,     // Mapped from score
  correctAnswers: number // Calculated from accuracy
}
```

**iOS Model:**
```swift
struct LeaderboardEntry {
    let id: Int
    let username: String
    let avatarUrl: String?
    let challengesCompleted: Int
    let totalXp: Int
    let correctAnswers: Int
}
```

**Potential Issues:**
1. ❌ `avatarUrl` always null - need to implement

## 2. Authentication API Endpoints

### POST /auth/login, /auth/register, /auth/google
**Backend Response:**
```typescript
{
  token: string,
  user: User // User object
}
```

**iOS Expectation:**
```swift
struct AuthResponse {
    let token: String
    let user: User
}
```

**Potential Issues:**
Need to verify User object structure matches

## 3. Profile API Endpoints

### GET /profile
**Backend Response:**
Need to analyze profileController.ts

### GET /profile/echo-score
**Backend Response:**
Need to analyze echoScoreController.ts

## 4. Common Issues Across All Endpoints

### Date Handling
- Backend sends ISO8601 strings
- iOS expects Date objects
- Custom date decoder needed

### Enum Values
- Backend sends string representations
- iOS expects specific enum raw values
- Must match exactly (e.g., "bias_swap", not "biasSwap")

### Null vs Optional
- Backend may send null
- iOS uses optionals
- Need proper null handling

### Field Name Conventions
- Backend uses snake_case
- iOS uses camelCase
- CodingKeys must map correctly

## 5. Recommendations

### Immediate Actions:
1. Create API contract tests
2. Generate TypeScript interfaces from iOS models
3. Add response validation middleware
4. Implement missing TODOs (avatarUrl, recentActivity, etc.)

### Long-term Solutions:
1. Use OpenAPI/Swagger for API documentation
2. Generate client code from API specs
3. Add integration tests between backend and iOS
4. Create shared type definitions

## 6. Systemic Issues to Fix

1. **Missing Data:**
   - `recentActivity` in challenge stats
   - `avatarUrl` in leaderboard and user profiles
   - `totalXpEarned` calculation

2. **Type Mismatches:**
   - Ensure all dates are ISO8601
   - Validate enum values match iOS expectations
   - Check number types (Int vs Double)

3. **Response Structure:**
   - Ensure all nested objects match iOS models
   - Handle empty arrays vs null
   - Validate required vs optional fields 