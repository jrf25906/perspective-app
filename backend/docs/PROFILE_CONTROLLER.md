# Profile Controller Implementation

## Overview

The Profile Controller provides comprehensive user profile management functionality for the Perspective App backend. It includes secure CRUD operations, validation, and statistics tracking.

## Features

### ✅ Implemented Features

1. **Profile Retrieval** - Get authenticated user's profile data
2. **Profile Updates** - Update user profile information with validation
3. **Echo Score Integration** - Retrieve user's echo score and bias profile
4. **Profile Statistics** - Get comprehensive user statistics
5. **Avatar Upload Placeholder** - Prepared for future avatar upload functionality
6. **Input Validation** - Comprehensive validation for all profile fields
7. **Authentication** - All endpoints require valid JWT authentication
8. **Error Handling** - Consistent error responses with proper HTTP status codes

## API Endpoints

### GET /api/profile
Retrieve the authenticated user's profile information.

**Authentication:** Required (JWT Bearer token)

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": null,
  "is_active": true,
  "email_verified": false,
  "echo_score": "75.50",
  "bias_profile": null,
  "preferred_challenge_time": "Morning",
  "current_streak": 5,
  "last_activity_date": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### PUT /api/profile
Update the authenticated user's profile information.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "first_name": "Updated",
  "last_name": "Name",
  "username": "newusername",
  "email": "newemail@example.com",
  "preferred_challenge_time": "Evening"
}
```

**Response:**
```json
{
  "user": {
    // Updated user object (same structure as GET /api/profile)
  },
  "message": "Profile updated successfully"
}
```

### GET /api/profile/echo-score
Retrieve the user's echo score and bias profile information.

**Authentication:** Required (JWT Bearer token)

**Response:**
```json
{
  "echoScore": 75.5,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "biasProfile": {
    "initial_assessment_score": 70,
    "political_lean": 1.5,
    "preferred_sources": ["BBC", "NPR"],
    "blind_spots": ["Conservative viewpoints"],
    "assessment_date": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/profile/stats
Retrieve comprehensive user statistics.

**Authentication:** Required (JWT Bearer token)

**Response:**
```json
{
  "currentStreak": 5,
  "echoScore": 75.5,
  "totalChallengesCompleted": 25,
  "averageAccuracy": 85.5,
  "totalTimeSpent": 120,
  "memberSince": "2024-01-01T00:00:00Z",
  "lastActivity": "2024-01-15T10:30:00Z"
}
```

### POST /api/profile/avatar
Upload user avatar (placeholder - not yet implemented).

**Authentication:** Required (JWT Bearer token)

**Response:**
```json
{
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Avatar upload not yet implemented"
  }
}
```

## Validation Rules

### Email Validation
- Must be a valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Must be unique across all users (excluding current user)

### Username Validation
- Must be between 3 and 30 characters
- Can only contain letters, numbers, and underscores (regex: `/^[a-zA-Z0-9_]+$/`)
- Must be unique across all users (excluding current user)

### Name Validation
- First name and last name must be 50 characters or less
- Optional fields

### General Validation
- At least one field must be provided for updates
- All fields are optional in update requests

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | Invalid or expired token |
| `USER_NOT_FOUND` | 404 | User not found in database |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `EMAIL_TAKEN` | 409 | Email already in use |
| `USERNAME_TAKEN` | 409 | Username already taken |
| `NOT_IMPLEMENTED` | 501 | Feature not yet implemented |
| `INTERNAL_ERROR` | 500 | Server error |

## Usage Examples

### Update Profile with cURL

```bash
# Set your JWT token
TOKEN="your_jwt_token_here"

# Update profile information
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "preferred_challenge_time": "Evening"
  }'
```

### Get Profile Stats

```bash
curl -X GET http://localhost:3000/api/profile/stats \
  -H "Authorization: Bearer $TOKEN"
```

## Security Features

1. **JWT Authentication** - All endpoints require valid JWT tokens
2. **Input Sanitization** - All inputs are validated and sanitized
3. **Password Protection** - Password hashes are never returned in responses
4. **Unique Constraints** - Email and username uniqueness enforced
5. **Rate Limiting** - Protected by application-level rate limiting

## Database Integration

The Profile Controller integrates with the following database tables:
- `users` - Main user profile data
- `bias_profiles` - User bias assessment data (future integration)

## Service Dependencies

- **UserService** - Handles all database operations
- **AuthMiddleware** - Provides JWT authentication
- **Database** - Knex.js with PostgreSQL

## Future Enhancements

1. **Avatar Upload** - File upload with image processing
2. **Profile Pictures** - Integration with cloud storage (AWS S3)
3. **Privacy Settings** - User privacy controls
4. **Profile Visibility** - Public/private profile options
5. **Social Features** - Following/followers functionality
6. **Profile Verification** - Email and phone verification
7. **Two-Factor Authentication** - Enhanced security options

## Testing

The implementation has been manually tested with the following scenarios:

✅ **Authentication Tests**
- Valid JWT token access
- Invalid token rejection
- Missing token handling

✅ **Profile Retrieval Tests**
- Successful profile retrieval
- User not found handling
- Database error handling

✅ **Profile Update Tests**
- Successful profile updates
- Email format validation
- Username length validation
- Duplicate email/username detection
- Empty update data validation

✅ **Echo Score Tests**
- Echo score retrieval
- Bias profile integration

✅ **Statistics Tests**
- Comprehensive stats retrieval
- Mock data handling

✅ **Avatar Upload Tests**
- Not implemented response

## Code Quality

- **TypeScript** - Full type safety
- **Error Handling** - Comprehensive error handling
- **Logging** - Console logging for debugging
- **Validation** - Input validation and sanitization
- **Documentation** - Inline code documentation
- **Consistency** - Follows established patterns

## Performance Considerations

- **Database Queries** - Optimized single queries where possible
- **Response Size** - Minimal response payloads
- **Caching** - Ready for Redis integration
- **Indexing** - Database indexes on email and username

## Monitoring and Logging

- All errors are logged to console with context
- Request/response logging available through Morgan middleware
- Ready for integration with logging services (Winston, etc.) 