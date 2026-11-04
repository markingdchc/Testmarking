@echo off
chcp 65001 >nul
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ScanBridge.vbs" 2>nul
call "%~dp0stop-scan-bridge.bat" >nul 2>nul
echo تمت الإزالة.
pause
