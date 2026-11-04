@echo off
chcp 65001 >nul
where node >nul 2>nul || (echo Node.js غير مثبت. حمّله من https://nodejs.org & pause & exit /b)
call "%~dp0stop-scan-bridge.bat" >nul 2>nul
set "VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ScanBridge.vbs"
> "%VBS%" echo CreateObject("WScript.Shell").Run "node ""%~dp0scan-bridge.js""", 0, False
wscript "%VBS%"
echo تم التثبيت: يعمل الوسيط تلقائياً مع تشغيل ويندوز (بدون نافذة).
pause
