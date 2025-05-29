# Setup Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for backend development)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Or use Docker:
   ```bash
   docker-compose up
   ```

## Android Setup

1. Open Android Studio
2. Open the `android` directory as a project
3. Sync Gradle files
4. Run the app on an emulator or device

## iOS Setup

1. Navigate to the iOS directory:
   ```bash
   cd ios
   ```

2. Install CocoaPods dependencies:
   ```bash
   pod install
   ```

3. Open `Perspective.xcworkspace` in Xcode
4. Build and run the project

## Development Workflow

1. Start the backend server
2. Run the mobile app (Android/iOS)
3. Make changes and test
4. Submit pull requests

## Troubleshooting

- Ensure all prerequisites are installed
- Check that ports 3000 (backend) and 8080 (mobile) are available
- Verify environment variables are set correctly
- If Xcode reports `The sandbox is not in sync with the Podfile.lock`, open a terminal, change to the `ios` directory and run `pod install`. Then open `Perspective.xcworkspace` instead of the Xcode project file.
