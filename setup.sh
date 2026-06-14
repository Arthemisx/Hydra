#!/usr/bin/env bash
set -euo pipefail

# Diretorios do projeto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "==> Preparando backend..."
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  python3 -m venv "$BACKEND_DIR/.venv"
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

"$BACKEND_DIR/.venv/bin/python" -m pip install -r "$BACKEND_DIR/requirements.txt"

echo "==> Criando banco e dados de exemplo (seed)..."
"$BACKEND_DIR/.venv/bin/python" "$BACKEND_DIR/scripts/seed.py"

echo "==> Preparando app Expo..."
if [ ! -f "$FRONTEND_DIR/.env" ]; then
  echo "EXPO_PUBLIC_API_BASE_URL=http://localhost:5000" > "$FRONTEND_DIR/.env"
fi

(
  cd "$FRONTEND_DIR"
  npm install
)

echo ""
echo "Setup concluido com sucesso."
echo "Agora rode: ./run.sh"
