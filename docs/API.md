# API Documentation

## Overview

The Perspective App API provides endpoints for user authentication, perspective sharing, Echo Score tracking, and data management.

## Base URL

```
https://api.perspective-app.com/v1
```

## Authentication

All API requests require authentication using JWT tokens.

```
Authorization: Bearer <your-token>
```

## Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - User logout

### Perspectives

- `GET /perspectives` - Get all perspectives
- `POST /perspectives` - Create new perspective
- `GET /perspectives/:id` - Get specific perspective
- `PUT /perspectives/:id` - Update perspective
- `DELETE /perspectives/:id` - Delete perspective

### Users

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/:id` - Get user by ID

### Echo Score

- `POST /echo-score/calculate` - Calculate and save user's Echo Score
- `GET /echo-score/current` - Get current Echo Score (calculated on-the-fly, not saved)
- `GET /echo-score/latest` - Get latest saved Echo Score with breakdown
- `GET /echo-score/history?days=30` - Get Echo Score history (optional days parameter)
- `GET /echo-score/progress?period=daily` - Get Echo Score progress (period: 'daily' or 'weekly')

#### Echo Score Response Format

```json
{
  "data": {
    "total_score": 75.5,
    "diversity_score": 80.0,
    "accuracy_score": 85.0,
    "switch_speed_score": 70.0,
    "consistency_score": 65.0,
    "improvement_score": 75.0,
    "calculation_details": {
      "diversity_metrics": {
        "gini_index": 0.8,
        "sources_read": ["CNN", "Fox News", "BBC"],
        "bias_range": 4.5
      },
      "accuracy_metrics": {
        "correct_answers": 17,
        "total_answers": 20,
        "recent_accuracy": 85.0
      },
      "speed_metrics": {
        "median_response_time": 45,
        "improvement_trend": 12.5
      },
      "consistency_metrics": {
        "active_days": 12,
        "total_days": 14,
        "streak_length": 7
      },
      "improvement_metrics": {
        "accuracy_slope": 0.05,
        "speed_slope": 0.03,
        "diversity_slope": 0.02
      }
    },
    "score_date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Progress Response Format

```json
{
  "data": {
    "period": "daily",
    "scores": [
      {
        "date": "2024-01-15",
        "total": 75.5,
        "components": {
          "diversity": 80.0,
          "accuracy": 85.0,
          "switch_speed": 70.0,
          "consistency": 65.0,
          "improvement": 75.0
        }
      }
    ],
    "trends": {
      "total": 0.5,
      "diversity": 0.3,
      "accuracy": 0.8,
      "switch_speed": -0.2,
      "consistency": 0.4,
      "improvement": 0.6
    }
  }
}
```

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `ECHO_SCORE_CALCULATION_ERROR` - Failed to calculate Echo Score
- `NO_ECHO_SCORE` - No Echo Score found for user
