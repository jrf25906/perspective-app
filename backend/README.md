# Backend API Server

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

## Quick Start

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
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── models/         # Database models
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
└── server.js       # Application entry point

migrations/         # Database migrations
tests/             # Test files
```

## Development

- Use ESLint for code formatting
- Write tests for new features
- Follow RESTful API conventions
- Document API changes
