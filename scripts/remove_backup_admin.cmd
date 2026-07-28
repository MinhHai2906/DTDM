@echo off
REM Run this script as Administrator (right-click -> Run as administrator)
REM It takes ownership, grants full control, then removes the backup folder.
setlocal
n
takeown /f "d:\KiheNam3\ĐTĐM\Thuong-Mai-Dien-Tu\frontend\project_backup_20260723110829" /r /d y
icacls "d:\KiheNam3\ĐTĐM\Thuong-Mai-Dien-Tu\frontend\project_backup_20260723110829" /grant %USERNAME%:F /T
rmdir /S /Q "d:\KiheNam3\ĐTĐM\Thuong-Mai-Dien-Tu\frontend\project_backup_20260723110829"
if exist "d:\KiheNam3\ĐTĐM\Thuong-Mai-Dien-Tu\frontend\project_backup_20260723110829" (
  echo REMOVE_FAILED
  exit /b 1
) else (
  echo REMOVED_BACKUP
)
echo.
echo Current contents of frontend:
dir /a "d:\KiheNam3\ĐTĐM\Thuong-Mai-Dien-Tu\frontend"
endlocal
