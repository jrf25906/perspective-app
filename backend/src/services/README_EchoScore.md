# Echo Score Service Documentation

## Overview

The Echo Score Service calculates and tracks users' cognitive flexibility and perspective-taking abilities based on the PRD algorithm. The score is composed of five components, each weighted to create a comprehensive measure of a user's progress in escaping echo chambers.

## Echo Score Components

### 1. **Diversity Score (25%)**
- Measures the ideological range of content consumed
- Calculated using the Gini index of bias ratings from articles read in the last 7 days
- Higher diversity in news sources = higher score

### 2. **Accuracy Score (25%)**
- Tracks correct answers in reasoning challenges
- Based on responses from the last 30 days
- Includes recent accuracy metric (last 7 days)

### 3. **Switch Speed Score (20%)**
- Measures how quickly users can switch perspectives
- Based on median response time for bias-swap challenges
- Faster perspective switching = higher score

### 4. **Consistency Score (15%)**
- Rewards regular engagement with the app
- Tracks active days out of the last 14 days
- Includes current streak length

### 5. **Improvement Score (15%)**
- Measures progress over time
- Calculates trend slopes for accuracy, speed, and diversity
- Positive improvement trends = higher score

## Algorithm Details

### Echo Score Formula
```
EchoScore = (0.25 × Diversity) + (0.25 × Accuracy) + (0.20 × SwitchSpeed) + (0.15 × Consistency) + (0.15 × Improvement)
```

### Key Calculations

#### Gini Index (for Diversity)
- Measures inequality in bias ratings distribution
- Range: 0 (perfect equality) to 1 (perfect inequality)
- Higher Gini = more diverse reading habits

#### Trend Calculation
- Uses linear regression to calculate improvement slopes
- Positive slope indicates improvement over time

## API Endpoints

### Calculate & Save Score
```
POST /api/echo-score/calculate
```
Calculates the user's current Echo Score and saves it to history.

### Get Current Score
```
GET /api/echo-score/current
```
Calculates the score on-the-fly without saving (useful for real-time updates).

### Get Latest Score
```
GET /api/echo-score/latest
```
Retrieves the most recently saved score with full breakdown.

### Get Score History
```
GET /api/echo-score/history?days=30
```
Returns historical scores for trend analysis.

### Get Progress
```
GET /api/echo-score/progress?period=daily
```
Returns score progression with trends (daily or weekly view).

## Database Schema

### echo_score_history
- Stores calculated scores with timestamps
- Includes component breakdowns
- Stores calculation details as JSON

### Related Tables
- `user_responses` - Challenge answers for accuracy calculation
- `user_reading_activity` - Article consumption for diversity
- `user_sessions` - Activity tracking for consistency
- `challenges_v2` - Challenge metadata

## Usage Example

```javascript
// Calculate and save a user's Echo Score
const score = await EchoScoreService.calculateAndSaveEchoScore(userId);

// Get score history for the last 30 days
const history = await EchoScoreService.getEchoScoreHistory(userId, 30);

// Get daily progress report
const progress = await EchoScoreService.getScoreProgress(userId, 'daily');
```

## Score Interpretation

- **0-20**: Just starting - Focus on exploring diverse content
- **21-40**: Building awareness - Keep expanding your sources
- **41-60**: Making progress - Your perspective flexibility is improving
- **61-80**: Strong performance - You're actively challenging your biases
- **81-100**: Expert level - You demonstrate excellent cognitive flexibility

## Future Enhancements

1. **Personalized Weights** - Adjust component weights based on user goals
2. **Social Comparison** - Anonymous percentile rankings
3. **Predictive Scoring** - ML-based score predictions
4. **Custom Challenges** - Targeted exercises based on weak components
5. **Achievement System** - Badges and milestones for score improvements 