#!/bin/bash
echo "Building new APK..."

# Clean old build files
rm -rf android/app/build
rm -f OrientationDay-QR-Scanner-v3.apk

# Build frontend
cd frontend
npm run build
cd ..

# Sync assets
npx cap sync android

# Build android
cd android
./gradlew assembleDebug
cd ..

# Copy APK
cp android/app/build/outputs/apk/debug/app-debug.apk OrientationDay-QR-Scanner-v3.apk

echo "Done! APK saved as OrientationDay-QR-Scanner-v3.apk in the main folder."
