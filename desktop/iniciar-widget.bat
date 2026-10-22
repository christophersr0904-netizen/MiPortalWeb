@echo off
taskkill /F /IM electron.exe >nul 2>&1
cd /d "%~dp0"
npx electron "%~dp0main.js"
