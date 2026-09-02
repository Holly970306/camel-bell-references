@echo off
chcp 65001 >nul
title 絲路歷史田調互動地圖伺服器

echo ========================================================
echo   正在啟動絲路歷史田調互動地圖本機伺服器...
echo   網址: http://localhost:8001
echo   已停用瀏覽器快取，改資料後直接重整即可看到更新
echo   若要停止伺服器，請直接關閉此視窗或按 Ctrl+C
echo ========================================================

:: 透過 PowerShell 在背景等待 1 秒後開啟預設瀏覽器
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 1; Start-Process 'http://localhost:8001'"

:: 啟動會送出不要快取標頭的本機伺服器（見 serve_map.py）
python "%~dp0serve_map.py" 8001

pause
