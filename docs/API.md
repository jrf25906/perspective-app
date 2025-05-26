# API Documentation

## Overview

The Perspective App API provides endpoints for user authentication, perspective sharing, and data management.

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
