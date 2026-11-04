@echo off
chcp 65001 >nul
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*scan-bridge*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
echo تم إيقاف الوسيط (إن كان يعمل). لا يتأثر أي برنامج Node آخر مثل خادم الأرشيف.
pause
