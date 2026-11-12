@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
cls

echo ========================================================================
echo   MIPORTALWEB PMO - CENTRO DE CONTROL UNIFICADO Y RESILIENTE (HTTP)
echo ========================================================================
echo.
echo [1/4] Detectando direccion IP Wi-Fi / LAN local...
set "IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /c:"192.168."') do (
    set "IP=%%a"
    goto :ip_found
)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "IP=%%a"
    goto :ip_found
)
:ip_found
if not defined IP set "IP=localhost"
set "IP=%IP: =%"
for /f "tokens=1 delims=(" %%b in ("%IP%") do set "IP=%%b"

echo [2/4] Liberando puertos 3000 y 48123 e iniciando supervisor resiliente...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000 " ^| findstr LISTENING') do (
    taskkill /F /T /PID %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":48123 " ^| findstr LISTENING') do (
    taskkill /F /T /PID %%p >nul 2>&1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -like '*supervisor-servicios.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
timeout /t 1 /nobreak >nul 2>&1 || ping -n 2 127.0.0.1 >nul

start "PMO-Supervisor-Servicios" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\supervisor-servicios.ps1" -RootDir "%~dp0."

echo.
echo   * PC Local:          http://localhost:3000/
echo   * Celular (Movil):   http://%IP%:3000/
echo   * Cockpit Bridge:    http://127.0.0.1:48123
echo.
echo [3/4] Esperando disponibilidad de Vite HTTP (:3000) y Cockpit (:48123)...

set "VITE_OK=0"
set "COCKPIT_OK=0"
for /l %%i in (1,1,30) do (
    if "!VITE_OK!"=="0" (
        curl.exe -s --max-time 2 -o nul http://localhost:3000/ >nul 2>&1
        if !errorlevel! equ 0 set "VITE_OK=1"
    )
    if "!COCKPIT_OK!"=="0" (
        curl.exe -s --max-time 2 -o nul http://127.0.0.1:48123/status >nul 2>&1
        if !errorlevel! equ 0 set "COCKPIT_OK=1"
    )
    if "!VITE_OK!"=="1" if "!COCKPIT_OK!"=="1" goto :servicios_listos
    timeout /t 1 /nobreak >nul 2>&1 || ping -n 2 127.0.0.1 >nul
)

:servicios_listos
if "!VITE_OK!"=="1" (
    echo [OK] Vite HTTP activo en http://localhost:3000/ y http://%IP%:3000/
) else (
    echo [WARN] Vite HTTP aun iniciando; verifica la ventana minimizada PMO-Supervisor-Servicios.
)

if "!COCKPIT_OK!"=="1" (
    echo [OK] Cockpit Bridge activo en http://127.0.0.1:48123
) else (
    echo [WARN] Cockpit Bridge aun iniciando; verifica la ventana minimizada PMO-Supervisor-Servicios.
)

echo.
echo [4/4] Abriendo navegador en http://localhost:3000/ ...
if "!VITE_OK!"=="1" (
    if not defined PMO_NO_BROWSER start "" "http://localhost:3000/"
) else (
    if not defined PMO_NO_BROWSER start "" "http://localhost:3000/"
    echo [INFO] Si el navegador carga antes de completar Vite, recarga tras 2 segundos.
)
echo ========================================================================
echo   Supervisor ejecutandose en segundo plano (ventana PMO-Supervisor-Servicios).
echo   Para detener ambos servicios cierra la ventana PMO-Supervisor-Servicios.
echo ========================================================================
endlocal
