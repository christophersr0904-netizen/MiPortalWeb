<#
.SYNOPSIS
  Supervisor resiliente en segundo plano para MiPortalWeb (REQ-OPS-30).
  Mantiene activos simultaneamente Vite HTTP (:3000) y Cockpit Bridge (:48123)
  con limpieza preventiva de puertos y auto-recuperacion ante caidas.
#>

param(
  [string]$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = 'Continue'
Set-Location -Path $RootDir

function Write-Log {
  param([string]$Level, [string]$Message)
  $ts = Get-Date -Format 'HH:mm:ss'
  Write-Host "[$ts] [$Level] $Message"
}

function Stop-ProcessTreeByPid {
  param([int]$TargetPid)
  if ($TargetPid -le 0) { return }
  try {
    & taskkill.exe /F /T /PID $TargetPid *> $null
  } catch {
    try {
      Stop-Process -Id $TargetPid -Force -ErrorAction SilentlyContinue
    } catch {}
  }
}

function Stop-PortListeners {
  param([int]$Port)

  $killedAny = $false
  $pids = New-Object System.Collections.Generic.HashSet[int]

  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
      if ($c.OwningProcess -gt 0) { [void]$pids.Add([int]$c.OwningProcess) }
    }
  } catch {}

  try {
    $netstatLines = & netstat.exe -aon 2>$null | Select-String -Pattern (":$Port\s+.*LISTENING\s+(\d+)")
    foreach ($match in $netstatLines) {
      $procId = [int]$match.Matches[0].Groups[1].Value
      if ($procId -gt 0) { [void]$pids.Add($procId) }
    }
  } catch {}

  foreach ($procId in $pids) {
    Write-Log 'CLEAN' "Liberando puerto $Port (PID $procId)..."
    Stop-ProcessTreeByPid -TargetPid $procId
    $killedAny = $true
  }

  return $killedAny
}

function Stop-OrphanCockpitInstances {
  $killedAny = $false
  try {
    $electrons = Get-CimInstance Win32_Process -Filter "Name = 'electron.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -like '*desktop*main.js*' }
    foreach ($el in $electrons) {
      Write-Log 'CLEAN' "Terminando instancia previa de Cockpit Electron (PID $($el.ProcessId))..."
      Stop-ProcessTreeByPid -TargetPid ([int]$el.ProcessId)
      $killedAny = $true
    }
  } catch {}
  return $killedAny
}

function Test-PortListening {
  param([int]$Port)
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conns) { return $true }
  } catch {}
  return $false
}

function Start-ManagedService {
  param(
    [string]$Nombre,
    [string]$NpmScript
  )

  Write-Log 'START' "Iniciando $Nombre (npm run $NpmScript)..."
  $proc = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c', "npm run $NpmScript" `
    -WorkingDirectory $RootDir `
    -WindowStyle Hidden `
    -PassThru
  return $proc
}

function Clear-AllTargetPorts {
  $k1 = Stop-PortListeners -Port 3000
  $k2 = Stop-PortListeners -Port 48123
  $k3 = Stop-OrphanCockpitInstances
  if ($k1 -or $k2 -or $k3) {
    Start-Sleep -Seconds 1
  }
}

$viteProc = $null
$cockpitProc = $null

Write-Log 'INIT' "Supervisor MiPortalWeb activo en $RootDir"
Clear-AllTargetPorts

try {
  $viteProc = Start-ManagedService -Nombre 'Vite HTTP (:3000)' -NpmScript 'dev:mobile'
  Start-Sleep -Milliseconds 800
  $cockpitProc = Start-ManagedService -Nombre 'Cockpit Bridge (:48123)' -NpmScript 'cockpit'

  while ($true) {
    Start-Sleep -Seconds 3

    if ($null -eq $viteProc -or $viteProc.HasExited) {
      $exitCode = if ($viteProc) { $viteProc.ExitCode } else { -1 }
      Write-Log 'WARN' "Vite HTTP (:3000) detenido (ExitCode=$exitCode). Auto-recuperando..."
      [void](Stop-PortListeners -Port 3000)
      Start-Sleep -Seconds 1
      $viteProc = Start-ManagedService -Nombre 'Vite HTTP (:3000)' -NpmScript 'dev:mobile'
    }

    if ($null -eq $cockpitProc -or $cockpitProc.HasExited) {
      # Si otro Cockpit legitimo ya sostiene el puerto 48123, no lanzar instancia que falle en singleInstanceLock
      if (-not (Test-PortListening -Port 48123)) {
        $exitCode = if ($cockpitProc) { $cockpitProc.ExitCode } else { -1 }
        Write-Log 'WARN' "Cockpit Bridge (:48123) detenido (ExitCode=$exitCode). Auto-recuperando..."
        [void](Stop-PortListeners -Port 48123)
        [void](Stop-OrphanCockpitInstances)
        Start-Sleep -Seconds 1
        $cockpitProc = Start-ManagedService -Nombre 'Cockpit Bridge (:48123)' -NpmScript 'cockpit'
      }
    }
  }
}
finally {
  Write-Log 'STOP' 'Cerrando supervisor y limpiando servicios hijos...'
  if ($viteProc -and -not $viteProc.HasExited) {
    Stop-ProcessTreeByPid -TargetPid $viteProc.Id
  }
  if ($cockpitProc -and -not $cockpitProc.HasExited) {
    Stop-ProcessTreeByPid -TargetPid $cockpitProc.Id
  }
  [void](Stop-PortListeners -Port 3000)
  [void](Stop-PortListeners -Port 48123)
  [void](Stop-OrphanCockpitInstances)
}

