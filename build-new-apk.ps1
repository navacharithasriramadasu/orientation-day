Write-Host "Building new APK..."

# Clean old build files
if (Test-Path "android/app/build") {
    Remove-Item -Path "android/app/build" -Recurse -Force
}
if (Test-Path "OrientationDay-QR-Scanner-v3.apk") {
    Remove-Item -Path "OrientationDay-QR-Scanner-v3.apk" -Force
}

# Build frontend
Push-Location frontend
npm run build
Pop-Location

# Sync assets
npx cap sync android

# Build android
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location

# Copy APK
Copy-Item "android/app/build/outputs/apk/debug/app-debug.apk" -Destination "OrientationDay-QR-Scanner-v3.apk" -Force

Write-Host "Done! APK saved as OrientationDay-QR-Scanner-v3.apk in the main folder."
