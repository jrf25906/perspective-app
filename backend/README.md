# Backend API Server

# Perspective Daily Challenge Loop - Proof of Concept

The current MVP focus for the Perspective backend is the **Daily Challenge Loop**, as outlined in the [Perspective PRD v2](link-to-prd). This proof of concept implements the core API functionality to power the daily challenge experience.

**Tech Stack:** Node.js, Express, PostgreSQL, JWT, Knex.js, Joi, Docker, and related tools.

**First Deliverable:** A cross-platform API to:
- Fetch today's challenge
- Submit user answers
- Provide instant feedback

The API is designed to support upcoming features such as Echo Score, streak tracking, adaptive challenge routing, and user profiles. For the full product vision and roadmap, refer to the [PRD](link-to-prd).

# Backend API Server

## Product Vision & Differentiators

**Perspective** bridges live news, cognitive training, and gamified tracking to foster critical thinking and self-awareness.

**Key Differentiators:**
- Content ↔ Reflection loop at the core of the experience
- Unique Echo Score metric for cognitive feedback
- Habit system and streaks for engagement
- Personal bias profile generation
- Safe, guided micro-debates and community forums
- Material 3-inspired UX for modern, accessible design

## Overview

Node.js Express backend API server for the Perspective App providing authentication, data management, and business logic.

## Features

- RESTful API design
- JWT-based authentication
- PostgreSQL database with Knex.js ORM
- Input validation with Joi
- Rate limiting and security middleware
- File upload support
- Docker containerization
- Comprehensive testing
- Daily Challenge Loop (fetch/submit)
- Echo Score and streak endpoints (planned)
- Adaptive challenge routing (planned)
- Community debate/micro-forum endpoints (planned)

## Quick Start

> **Note:** These instructions are for the backend REST API server only.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start PostgreSQL (using Docker):
   ```bash
   docker-compose up postgres
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## API Endpoints

See [API Documentation](../docs/API.md) for detailed endpoint information.

## Database

The application uses PostgreSQL with Knex.js for query building and migrations.

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Docker

```bash
# Build and run with Docker Compose
docker-compose up

# Run in production mode
docker-compose -f docker-compose.prod.yml up
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DB_*` - Database connection settings
- `JWT_SECRET` - Secret for JWT token signing
- `AWS_*` - AWS S3 configuration for file uploads

## Project Structure

```
src/
├── controllers/         # Route handlers (e.g., challenges logic in challengeController.js/.ts)
├── middleware/          # Express middleware
├── models/              # Database models
├── routes/              # API endpoints for challenge and profile
├── services/            # Business logic (Echo Score logic planned for echoScoreService.js)
├── utils/               # Utility functions
└── server.js            # Application entry point

migrations/              # Database migrations
tests/                   # Test files
```

## Development

- Use ESLint for code formatting
- Write tests for new features
- Follow RESTful API conventions
- Document API changes

## References

- [Perspective PRD v2](link-to-prd)
- [Design System Documentation](link-to-design-system)
- Brand assets and full UX/UI guidelines are available upon request.
