@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js 20 or newer, then try again.
 pause
 exit /b 1
)
if not exist node_modules\express (
 echo Installing game dependencies. Please wait...
 call npm install
 if errorlevel 1 (
  echo Installation failed. Send a screenshot of this window.
  pause
  exit /b 1
 )
)
echo Starting XENO. Keep this window open.
echo When ready, open http://localhost:3000 in your browser.
call npm start
pause
