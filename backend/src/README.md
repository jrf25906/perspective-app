# Backend Source Structure

This backend application follows a modular architecture to improve maintainability, testability, and clarity.

## Directory Structure

```
src/
├── app-config/       # Configuration modules
│   ├── server.config.ts    # Server configuration (port, env, CORS, etc.)
│   └── security.config.ts  # Security settings (helmet, rate limiting)
├── setup/            # Application setup modules
│   ├── middleware.setup.ts # Middleware initialization
│   ├── routes.setup.ts     # Route registration
│   ├── scheduler.setup.ts  # Background job schedulers
│   └── shutdown.setup.ts   # Graceful shutdown handling
├── middleware/       # Custom middleware
├── routes/          # API route definitions
├── controllers/     # Route controllers
├── services/        # Business logic services
├── models/          # Data models
├── db/              # Database connection and queries
├── types/           # TypeScript type definitions
├── config.ts        # Database configuration (legacy)
└── server.ts        # Main application entry point
```

## Module Responsibilities

### Configuration (`app-config/`)
- **server.config.ts**: Centralizes all server-related configuration including environment variables, port settings, CORS options, and feature flags
- **security.config.ts**: Contains security middleware configurations for helmet and rate limiting

### Setup (`setup/`)
- **middleware.setup.ts**: Handles all middleware initialization in a structured way
  - Security middleware (helmet, CORS, rate limiting)
  - Logging middleware (morgan)
  - Body parsing middleware
  - Request tracking middleware
- **routes.setup.ts**: Manages route registration
  - Health check endpoint
  - API routes
  - 404 handler
  - Error handler
- **scheduler.setup.ts**: Initializes background job schedulers
- **shutdown.setup.ts**: Sets up graceful shutdown handlers for SIGTERM/SIGINT

### Main Entry Point (`server.ts`)
The simplified server.ts now:
1. Loads environment variables
2. Creates the Express app
3. Sets up all middleware
4. Registers all routes
5. Initializes schedulers
6. Starts the server

This modular approach makes it easy to:
- Test individual components in isolation
- Add new features without cluttering server.ts
- Understand the application structure at a glance
- Maintain consistent patterns across the codebase 