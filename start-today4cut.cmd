@echo off
cd /d "%~dp0"
echo Starting TODAY 4 CUT from:
cd
echo.
echo Keep this window open while using the photo booth.
echo Press Ctrl+C to stop the server.
echo Local link: http://127.0.0.1:4173/index.html
echo Same Wi-Fi preview link: http://172.20.146.83:4173/index.html
echo.
echo For camera access on other phones, deploy to an HTTPS host like GitHub Pages.
echo.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:4173/'"
python -m http.server 4173 --bind 0.0.0.0
pause
