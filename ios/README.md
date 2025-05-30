# iOS App

## Overview

Native iOS application for the Perspective App built with Swift and UIKit/SwiftUI.
Older prototype projects have been removed to avoid confusion; the `Perspective`
directory now contains the sole maintained iOS implementation.

## Features

- Modern iOS design patterns
- SwiftUI for modern UI components
- MVVM architecture
- Alamofire for networking
- KeychainAccess for secure token storage
- Configurable API base URL via `Info.plist`

## Build Requirements

- Xcode 15.0+
- iOS 14.0+
- Swift 5.9+
- CocoaPods

## Setup

1. Install CocoaPods if not already installed:
   ```bash
   sudo gem install cocoapods
   ```

2. Navigate to the iOS directory:
   ```bash
   cd ios
   ```

3. Install dependencies:
   ```bash
   pod install
   ```

4. Update `API_BASE_URL` in `Perspective/Info.plist` to point to your backend server.

5. Open the workspace in Xcode:
   ```bash
   open Perspective.xcworkspace
   ```

6. Build and run the project

## Project Structure

- `Perspective/` - Main application source code
- `PerspectiveTests/` - Unit tests
- `PerspectiveUITests/` - UI tests
- `Perspective.xcodeproj/` - Xcode project configuration

## Dependencies

- Alamofire - HTTP networking
- SwiftyJSON - JSON parsing
- Kingfisher - Image loading and caching
- KeychainAccess - Secure credential storage

## Development

- Use SwiftUI for new UI components
- Follow MVVM architecture patterns
- Write unit tests for business logic
- Use Instruments for performance profiling
