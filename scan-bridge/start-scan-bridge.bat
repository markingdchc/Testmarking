@echo off
chcp 65001 >nul
title Scan Bridge
where node >nul 2>nul || (echo Node.js غير مثبت. حمّله من https://nodejs.org & pause & exit /b)
call "%~dp0stop-scan-bridge.bat" >nul 2>nul
node "%~dp0scan-bridge.js"
pause
