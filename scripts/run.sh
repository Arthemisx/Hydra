#!/usr/bin/env bash
set -euo pipefail

# Diretorios do projeto (este script vive em scripts/, sobe um nivel)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Verifica se o setup ja foi feito
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "Ambiente Python nao encontrado. Rode ./hydra setup primeiro."
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Dependencias do Expo nao encontradas. Rode ./hydra setup primeiro."
  exit 1
fi

# Encerra os processos filhos ao sair (Ctrl+C)
cleanup() {
  echo ""
  echo "Encerrando backend e Expo..."
  kill 0
}
trap cleanup EXIT INT TERM

# Inicia o backend Flask
(
  cd "$BACKEND_DIR"
  # shellcheck disable=SC1091
  source .venv/bin/activate
  python app.py
) &

# Inicia o Expo
(
  cd "$FRONTEND_DIR"
  npx expo start --tunnel -c --port 8083
) &

echo "Backend e Expo iniciados."
echo "Expo:     Tunnel + QR (porta 8083)"
echo "Backend:  http://localhost:5000"
echo "Pressione Ctrl+C para encerrar."

# Aguarda os processos
wait
