@echo off
chcp 65001 >nul
title 絲路歷史田調互動地圖伺服器

echo ========================================================
echo   正在啟動絲路歷史田調互動地圖本機伺服器...
echo   網址: http://localhost:8000
echo   若要停止伺服器，請直接關閉此視窗或按 Ctrl+C
echo ========================================================

:: 透過 PowerShell 在背景等待 1 秒後開啟預設瀏覽器
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 1; Start-Process 'http://localhost:8000'"

:: 啟動 Python 本機 HTTP 伺服器
python -m http.server 8000

pause
