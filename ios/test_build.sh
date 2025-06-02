#!/bin/bash

# Test build script for iOS app
cd /Users/jamesfarmer/perspective-app/ios

echo "Testing iOS build..."

# Clean build folder
rm -rf build/

# Try to build for simulator
xcodebuild -workspace Perspective.xcworkspace \
  -scheme Perspective \
  -sdk iphonesimulator \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \
  clean build 2>&1 | tee build_log.txt

# Check if build succeeded
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Build succeeded!"
else
    echo "❌ Build failed. Checking errors..."
    grep -E "(error:|warning:)" build_log.txt | head -20
fi