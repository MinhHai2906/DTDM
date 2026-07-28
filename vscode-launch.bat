@echo off
REM ============================================
REM Launch VSCode with Auto-Sync
REM ============================================

setlocal enabledelayedexpansion

title PhoneStore - VSCode Auto-Sync

echo.
echo ╔════════════════════════════════════════════════╗
echo ║  🎯 VSCode Auto-Sync Launcher                  ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Check if VSCode is installed
where code >nul 2>&1
if errorlevel 1 (
    echo ❌ VSCode not found!
    echo 📌 Install VSCode or add to PATH
    pause
    exit /b 1
)

echo ✅ VSCode found
echo.

REM Start sync in background
echo 🚀 Starting auto-sync...
start powershell -NoProfile -ExecutionPolicy Bypass -File "vscode-sync.ps1"

REM Wait for sync to start
timeout /t 2 /nobreak

REM Open VSCode
echo 📂 Opening VSCode...
code .

echo.
echo ✅ VSCode opened with auto-sync enabled
echo 📝 Monitor the PowerShell window for sync status
echo.

pause
