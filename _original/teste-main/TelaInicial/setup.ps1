$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "backend"
$expoDir = Join-Path $projectRoot "AdesivoSmash"

Write-Host "==> Preparando backend..."
if (-not (Test-Path (Join-Path $backendDir ".venv"))) {
  python -m venv (Join-Path $backendDir ".venv")
}

if (-not (Test-Path (Join-Path $backendDir ".env"))) {
  Copy-Item (Join-Path $backendDir ".env.example") (Join-Path $backendDir ".env")
}

& (Join-Path $backendDir ".venv\Scripts\python.exe") -m pip install -r (Join-Path $backendDir "requirements.txt")

Write-Host "==> Preparando app Expo..."
if (-not (Test-Path (Join-Path $expoDir ".env"))) {
  Set-Content -Path (Join-Path $expoDir ".env") -Value "EXPO_PUBLIC_API_BASE_URL=http://localhost:5000"
}

Push-Location $expoDir
npm install
Pop-Location

Write-Host ""
Write-Host "Setup concluido com sucesso."
Write-Host "Agora rode: .\run.ps1"
