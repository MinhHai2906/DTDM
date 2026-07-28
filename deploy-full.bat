@echo off
REM ============================================
REM PhoneStore Full Deployment Script
REM Copy + Deploy (Hosting + Firestore)
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════╗
echo ║  🚀 PhoneStore Full Deployment                 ║
echo ║  (Hosting + Firestore Rules + Indexes)         ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Check if Firebase CLI is installed
echo 🔍 Checking Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not installed!
    echo 📌 Install: npm install -g firebase-tools
    pause
    exit /b 1
)
echo ✅ Firebase CLI found
echo.

REM Step 1: Copy frontend/project to public
echo 📁 Copying frontend/project to public...
robocopy "frontend\project" "public" /MIR /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
    echo ❌ Copy failed!
    pause
    exit /b 1
)
echo ✅ Files copied successfully
echo.

REM Step 2: Deploy to Firebase (everything)
echo 🚀 Deploying to Firebase...
echo   - Hosting
echo   - Firestore Rules
echo   - Firestore Indexes
echo.

firebase deploy
if errorlevel 1 (
    echo ❌ Deployment failed!
    echo 📌 Check your Internet connection or Firebase setup
    pause
    exit /b 1
)
echo.

REM Step 3: Success
echo ╔════════════════════════════════════════════════╗
echo ║  ✅ Full Deployment completed!                 ║
echo ║                                                ║
echo ║  🌍 Your website is live at:                   ║
echo ║  https://web-dienthoai0-dtdm.firebaseapp.com   ║
echo ║                                                ║
echo ║  📊 Firestore Rules & Indexes deployed         ║
echo ╚════════════════════════════════════════════════╝
echo.

pause
