@echo off
setlocal EnableExtensions
cd /d "%~dp0"
cls
echo ========================================================
echo   INICIANDO SERVIDOR LOCAL HTTPS PARA MOVIL - MIPORTALWEB
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
echo [OK] Tu enlace HTTPS para entrar desde el celular es:
echo.
echo   --^>  https://%IP%:3000/
echo.
echo (Al usar certificado autofirmado local, acepta la advertencia
echo  "Configuracion avanzada -> Continuar" la primera vez.)
echo ========================================================
echo.
call npm run dev:mobile
if errorlevel 1 pause
endlocal

