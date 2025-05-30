# Adaptive Challenge System Documentation

## Overview

The Adaptive Challenge System intelligently selects challenges for users based on their performance history, bias profile, skill levels, and learning patterns. This system ensures that users are consistently challenged at an appropriate level while promoting growth and diversity in their critical thinking skills.

## Key Features

### 1. User Skill Level Adaptation
- Dynamically adjusts challenge difficulty based on recent performance
- Tracks success rates across different difficulty levels
- Gradually increases difficulty as users improve
- Provides safety nets when users struggle

### 2. Bias Profile Consideration
- Analyzes user's political lean and content consumption patterns
- Prioritizes challenges that expose users to underrepresented viewpoints
- Tracks bias exposure across different sources
- Promotes intellectual diversity

### 3. Challenge History Analysis
- Prevents repetition of recent challenges
- Tracks performance by challenge type
- Identifies strengths and weaknesses
- Monitors improvement trends

### 4. Difficulty Progression
- Three difficulty levels: Beginner, Intermediate, Advanced
- Smart progression based on success thresholds
- Considers both overall and recent performance
- Time-based adjustments for challenge completion

## Implementation Details

### Core Algorithm

The adaptive challenge selection uses a weighted scoring system:

```typescript
Score = Base Score × 
  (Difficulty Score × 0.3) × 
  (Weakness Focus × 0.25) × 
  (Bias Diversity × 0.3) × 
  (Type Diversity × 0.2) × 
  Streak Multiplier × 
  Time Adjustment
```

### Configuration Parameters

```typescript
{
  INCREASE_DIFFICULTY_THRESHOLD: 0.85,    // 85% success rate triggers harder challenges
  DECREASE_DIFFICULTY_THRESHOLD: 0.40,    // 40% success rate triggers easier challenges
  MIN_CHALLENGES_FOR_ADJUSTMENT: 3,       // Minimum challenges before difficulty adjustment
  BIAS_CHALLENGE_WEIGHT: 0.3,            // Weight for bias diversity
  WEAKNESS_FOCUS_WEIGHT: 0.25,           // Weight for targeting weak areas
  DIVERSITY_WEIGHT: 0.2,                 // Weight for challenge type variety
  RECENT_DAYS_TO_CONSIDER: 14,           // Days of history for recent performance
  REPEAT_PREVENTION_DAYS: 7,             // Prevent repeating challenges for 7 days
  PERFORMANCE_WINDOW_DAYS: 30,           // Overall performance tracking window
  STREAK_BONUS_WEIGHT: 0.1               // Bonus multiplier for streak maintenance
}
```

## API Endpoints

### Get Adaptive Challenge
```
GET /api/challenge/adaptive/next
Authorization: Bearer {token}

Response:
{
  "id": 123,
  "type": "bias_swap",
  "difficulty": "intermediate",
  "title": "Climate Policy Perspectives",
  "description": "...",
  "content": {...},
  "estimated_time_minutes": 10,
  "xp_reward": 50
}
```

### Get Challenge Recommendations
```
GET /api/challenge/adaptive/recommendations?count=3
Authorization: Bearer {token}

Response:
{
  "recommendations": [...],
  "count": 3
}
```

### Get User Progress Analysis
```
GET /api/challenge/progress
Authorization: Bearer {token}

Response:
{
  "strengths": ["logic_puzzle", "data_literacy"],
  "weaknesses": ["bias_swap"],
  "suggestedFocus": ["bias_swap", "ethical_dilemma"],
  "progressTrend": "improving",
  "readyForAdvanced": true
}
```

## Selection Criteria

### 1. Difficulty Selection
- **New Users**: Start with beginner challenges
- **High Performers** (>85% success): Progress to harder challenges
- **Struggling Users** (<40% success): Move to easier challenges
- **Stable Performance**: Maintain current difficulty

### 2. Type Selection
- Prioritizes challenge types where user has lower success rates
- Ensures variety by limiting repetition of same types
- Balances between strengthening weaknesses and maintaining engagement

### 3. Bias Exposure (for Bias Swap Challenges)
- Tracks which bias perspectives user has been exposed to
- Prioritizes underexposed viewpoints (<15% of total exposure)
- Provides bonus score for challenges containing opposing viewpoints
- Considers user's political lean from bias profile

### 4. Time Considerations
- Adjusts scoring based on user's typical completion times
- Penalizes challenges that historically take much longer than estimated
- Considers user's available time preferences

## Performance Tracking

### Metrics Tracked
- Overall success rate (30-day window)
- Recent success rate (14-day window)
- Performance by challenge type
- Performance by difficulty level
- Average completion times
- Streak maintenance
- Bias exposure distribution

### Progress Analysis
The system provides detailed progress analysis including:
- Identified strengths (>80% success rate)
- Identified weaknesses (<50% success rate)
- Suggested focus areas
- Progress trend (improving/stable/declining)
- Readiness for advanced challenges

## Benefits

1. **Personalized Learning**: Each user gets challenges tailored to their skill level
2. **Continuous Improvement**: Gradually increases difficulty to promote growth
3. **Balanced Perspective**: Ensures exposure to diverse viewpoints
4. **Engagement**: Maintains appropriate challenge level to prevent frustration or boredom
5. **Data-Driven**: Uses comprehensive performance data for intelligent selection

## Future Enhancements

1. **Machine Learning Integration**: Use ML models for more sophisticated difficulty prediction
2. **Collaborative Filtering**: Recommend challenges based on similar users' success patterns
3. **Time-of-Day Optimization**: Consider user's performance patterns at different times
4. **Topic-Based Adaptation**: Track performance by subject matter, not just challenge type
5. **Motivational Factors**: Include psychological factors like recent failures/successes in selection 