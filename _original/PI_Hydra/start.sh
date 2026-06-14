#!/bin/bash
# ═══════════════════════════════════════════
#  Hydra — NutriEsportiva
#  Sobe backend + web com um comando
# ═══════════════════════════════════════════

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔═══════════════════════════════════╗"
echo "  ║     Hydra — NutriEsportiva        ║"
echo "  ║     Iniciando os servicos...       ║"
echo "  ╚═══════════════════════════════════╝"
echo ""

# ── Instalar dependencias se necessario ──
if ! python -c "import flask" 2>/dev/null; then
    echo "[1/3] Instalando dependencias do backend..."
    pip install --user -r "$DIR/backend/requirements.txt" -q
else
    echo "[1/3] Dependencias do backend OK"
fi

if [ ! -d "$DIR/web/node_modules" ]; then
    echo "[2/3] Instalando dependencias do web..."
    cd "$DIR/web" && npm install --silent
else
    echo "[2/3] Dependencias do web OK"
fi

# ── Subir backend ──
echo "[3/3] Subindo servicos..."
echo ""

cd "$DIR/backend"
DATABASE_URL=sqlite:///hydra.db python app.py &
BACKEND_PID=$!
echo "  Backend (Flask)  -> http://localhost:5000"

# Esperar backend subir
sleep 2

# ── Subir web ──
cd "$DIR/web"
NEXT_PUBLIC_API_URL=http://localhost:5000/api npx next dev --port 3000 &
WEB_PID=$!
echo "  Web    (Next.js) -> http://localhost:3000"

echo ""
echo "  Usuarios demo (apos primeiro start):"
echo "    Equipe:  maria@saocamilo.br / team123"
echo "    Atleta:  carlos@email.com / atleta123"
echo "    Atleta:  ana@email.com / atleta123"
echo ""
echo "  Para criar dados demo: cd backend && DATABASE_URL=sqlite:///hydra.db python seed.py"
echo ""
echo "  Pressione Ctrl+C para parar tudo."
echo ""

# ── Trap para matar os dois ao sair ──
cleanup() {
    echo ""
    echo "Parando servicos..."
    kill $BACKEND_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Esperar
wait
