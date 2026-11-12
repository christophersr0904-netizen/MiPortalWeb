@echo off
setlocal EnableExtensions
cd /d "%~dp0"
cls
echo ========================================================
echo   INICIANDO SERVIDOR LOCAL HTTP PARA MOVIL - MIPORTALWEB
echo ========================================================
echo.
echo Buscando tu direccion IP local actual...
set "IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "IP=%%a"
    goto :found
)
:found
if not defined IP set "IP=localhost"
set "IP=%IP: =%"
for /f "tokens=1 delims=(" %%b in ("%IP%") do set "IP=%%b"
echo.
echo [OK] Tus enlaces HTTP sin fricciones de certificado son:
echo.
echo   * PC Local:  http://localhost:3000/
echo   * Celular:   http://%IP%:3000/
echo.
echo (Servidor HTTP plano habilitado sin certificados autofirmados.)
echo ========================================================
echo.
echo Verificando y liberando puerto 3000...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000 " ^| findstr LISTENING') do (
    echo [CLEAN] Terminando proceso en puerto 3000 (PID %%p^)...
    taskkill /F /PID %%p >nul 2>&1
)
timeout /t 1 /nobreak >nul 2>&1 || ping -n 2 127.0.0.1 >nul
echo.
call npm run dev:mobile
if errorlevel 1 pause
endlocal

