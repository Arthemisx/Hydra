$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

if (-not (Test-Path (Join-Path $backendDir ".venv"))) {
  Write-Host "Ambiente Python nao encontrado. Rode .\setup.ps1 primeiro."
  exit 1
}

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
  Write-Host "Dependencias do Expo nao encontradas. Rode .\setup.ps1 primeiro."
  exit 1
}

$backendCommand = "cd '$backendDir'; .\.venv\Scripts\Activate.ps1; python app.py"
$expoCommand = "cd '$frontendDir'; npx expo start --tunnel -c --port 8083"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand
Start-Process powershell -ArgumentList "-NoExit", "-Command", $expoCommand

Write-Host "Backend e Expo iniciados."
Write-Host "Expo:     Tunnel + QR (porta 8083)"
Write-Host "Backend:  http://localhost:5000"
