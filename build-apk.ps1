# Orientation Day 2026 - Android APK Build Script
$ErrorActionPreference = "Stop"

Write-Host "=========================================================="  -ForegroundColor Cyan
Write-Host " Building Orientation Day 2026 Mobile APK" -ForegroundColor Cyan
Write-Host "=========================================================="  -ForegroundColor Cyan

# 1. Locate Java 21/17 JDK
$jdkPath = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
if (Test-Path $jdkPath) {
    $env:JAVA_HOME = $jdkPath
    $env:PATH = "$jdkPath\bin;$env:PATH"
    Write-Host "[1/5] Using JDK: $jdkPath" -ForegroundColor Green
} elseif ($env:JAVA_HOME) {
    Write-Host "[1/5] Using system JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
} else {
    Write-Host "[1/5] Searching for JDK..." -ForegroundColor Yellow
}

# 2. Locate Android SDK
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $sdkPath) {
    $env:ANDROID_HOME = $sdkPath
    Write-Host "[2/5] Using Android SDK: $sdkPath" -ForegroundColor Green
}

# 3. Build Frontend
Write-Host "[3/5] Building React Frontend with Vite..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
Set-Location $PSScriptRoot

# 4. Sync Capacitor
Write-Host "[4/5] Syncing Capacitor Android assets..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
if (Test-Path "android\app\src\main\assets\public") { Remove-Item -Recurse -Force "android\app\src\main\assets\public" }
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }

# 5. Assemble APK with Gradle
Write-Host "[5/5] Compiling and Packaging Android APK..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\android"
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { throw "Gradle APK build failed" }
Set-Location $PSScriptRoot

# Copy to root
$sourceApk = "$PSScriptRoot\android\app\build\outputs\apk\debug\app-debug.apk"
$targetApk = "$PSScriptRoot\OrientationDay-QR-Scanner.apk"

if (Test-Path $sourceApk) {
    Copy-Item -Path $sourceApk -Destination $targetApk -Force
    $sizeMb = [math]::Round(((Get-Item $targetApk).Length / 1MB), 2)
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host " BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host " APK File: $targetApk" -ForegroundColor White
    Write-Host " Size: $sizeMb MB" -ForegroundColor White
    Write-Host "==========================================================`n" -ForegroundColor Green
} else {
    throw "Output APK not found at $sourceApk"
}
