# Perspective App Setup Guide

This guide will help you set up the Perspective app development environment.

## Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- PostgreSQL (v15 or higher)
- Redis (optional, for caching)
- Docker and Docker Compose (optional, for containerized development)

## Backend Setup

### 1. Environment Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and update the values according to your local setup:
   ```bash
   # For macOS/Linux
   nano .env
   
   # For Windows
   notepad .env
   ```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

1. Start the database and Redis services:
   ```bash
   docker-compose up -d postgres redis
   ```

2. The database will be automatically created with the following credentials:
   - Host: `localhost`
   - Port: `5432`
   - Database: `perspective_db`
   - Username: `postgres`
   - Password: `password`

#### Option B: Local PostgreSQL Installation

1. Create the development database:
   ```bash
   createdb perspective_dev
   ```

2. Create the test database:
   ```bash
   createdb perspective_test
   ```

3. Update your `.env` file with your PostgreSQL credentials.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. (Optional) Seed the Database

```bash
npm run seed
```

### 6. Start the Development Server

```bash
npm run dev
```

The backend server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Environment Variables Guide

Here's a detailed explanation of each environment variable:

### Essential Variables

- **`NODE_ENV`**: Application environment (`development`, `test`, `production`)
- **`PORT`**: Port number for the backend server
- **`JWT_SECRET`**: Secret key for JWT token generation (⚠️ **MUST** be changed in production)

### Database Configuration

- **`DB_HOST`**: Database server hostname
- **`DB_PORT`**: Database server port
- **`DB_NAME`**: Database name for development
- **`DB_USER`**: Database username
- **`DB_PASSWORD`**: Database password
- **`DATABASE_URL`**: Full database connection string (used in production)

### Optional Services

- **AWS Configuration**: Required only if using S3 for file uploads
- **Redis Configuration**: Required only if implementing caching
- **Email Configuration**: Required only if sending emails

## Running with Docker

To run the entire stack with Docker:

```bash
docker-compose up
```

This will start:
- Backend API server
- PostgreSQL database
- Redis cache
- Nginx reverse proxy

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   
   # Docker
   docker ps | grep postgres
   ```

2. Verify database credentials in `.env` match your PostgreSQL setup

3. Check if the database exists:
   ```bash
   psql -U postgres -l | grep perspective
   ```

### Port Already in Use

If port 3000 is already in use, either:
1. Change the `PORT` in your `.env` file
2. Stop the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

### Permission Issues

If you encounter permission issues with npm:
```bash
sudo npm install -g npm@latest
```

## Next Steps

1. Check out the API documentation in `backend/README.md`
2. Set up the mobile apps (iOS/Android) - see their respective README files
3. Review the shared code in the `shared/` directory

## Support

If you encounter any issues during setup, please:
1. Check the troubleshooting section above
2. Review the backend logs for error messages
3. Create an issue in the project repository 