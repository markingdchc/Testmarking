@echo off
chcp 65001 >nul
title خادم الأرشيف المحلي

echo.
echo ═══════════════════════════════════════
echo   🖥️  خادم الأرشيف المحلي
echo ═══════════════════════════════════════
echo.

:: التحقق من Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت على هذا الجهاز!
    echo.
    echo 📥 يرجى تحميله من: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: التحقق من node_modules
if not exist "node_modules" (
    echo 📦 جاري تثبيت المكتبات المطلوبة لأول مرة...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ فشل التثبيت!
        pause
        exit /b 1
    )
    echo.
)

echo 🚀 جاري تشغيل الخادم...
echo.

:: تشغيل الخادم
node server.js

pause