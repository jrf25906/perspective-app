# Perspective App - Claude Memory

## Project Overview
Multi-platform training application designed to help users escape echo chambers and build cognitive flexibility through news exposure, interactive reasoning drills, and a personalized "Echo Score" coaching system.

## Architecture
- **Backend**: Node.js/Express.js with TypeScript (`/backend/`)
- **iOS**: Native SwiftUI app (`/ios/`)
- **Android**: Kotlin/Jetpack Compose app (`/android/`)
- **Database**: PostgreSQL (production), SQLite (development)

## Development Commands

### Backend Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with test data

### Code Style & Standards
- **Language**: TypeScript for backend, Swift for iOS, Kotlin for Android
- **Indentation**: 2 spaces for backend/web, 4 spaces for mobile
- **Line Length**: 100 characters max
- **Linting**: ESLint with Airbnb config for backend
- **Testing**: Jest for backend, XCTest for iOS, JUnit for Android

## Backend Technical Details
- **Framework**: Express.js with TypeScript
- **Database ORM**: Knex.js for migrations and queries
- **Authentication**: JWT tokens with Google OAuth
- **Security**: Helmet.js, CORS, rate limiting
- **Environment**: Node.js ≥20.0.0, npm ≥8.0.0

## Mobile App Dependencies
### iOS (CocoaPods)
- Alamofire (networking)
- SwiftyJSON, Kingfisher, KeychainAccess, GoogleSignIn

### Android (Gradle)
- Retrofit, OkHttp, Navigation Compose, Lifecycle ViewModel

## Key Features
- Daily Challenge System with rotating challenge types
- Echo Score 2.0 multi-factor cognitive flexibility tracking
- News ingestion from multiple sources with bias ratings
- Offline functionality and background sync
- Content moderation pipeline

## Development Workflow
- **Environment**: Use Docker Compose for local development
- **Database**: Run migrations before seeding data
- **Testing**: Always run tests and linting before commits
- **Branches**: Feature branches from main, squash commits before merging
- **Commits**: Descriptive commit messages following conventional commits

## File Organization
- `/backend/src/` - TypeScript backend source
- `/ios/` - iOS SwiftUI application
- `/android/` - Android Kotlin application
- `/shared/` - Common assets and documentation
- `/docs/` - Project documentation and setup guides

## Environment Variables
- Check `.env.example` files in each platform directory
- Database connection, JWT secrets, OAuth keys required
- Different configs for development/production environments