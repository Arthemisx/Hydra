#!/usr/bin/env sh
set -e

# Espera o banco de dados ficar disponivel (quando usando Postgres)
if [ -n "$DATABASE_URL" ]; then
  echo "==> Aguardando o banco de dados..."
  python - <<'PY'
import os, time, sys
from urllib.parse import urlparse

url = os.environ.get("DATABASE_URL", "")
if url.startswith("postgres"):
    import psycopg2
    p = urlparse(url)
    for i in range(30):
        try:
            conn = psycopg2.connect(
                host=p.hostname,
                port=p.port or 5432,
                user=p.username,
                password=p.password,
                dbname=p.path.lstrip("/"),
            )
            conn.close()
            print("    banco disponivel.")
            break
        except Exception as exc:
            print(f"    tentativa {i + 1}/30 falhou: {exc}")
            time.sleep(2)
    else:
        print("    o banco nao respondeu a tempo.")
        sys.exit(1)
PY
fi

# Cria as tabelas e (opcionalmente) popula com dados demo. Idempotente.
if [ "${SEED_ON_START:-1}" = "1" ]; then
  echo "==> Criando tabelas e populando dados demo..."
  python scripts/seed.py || echo "    seed falhou (seguindo mesmo assim)."
fi

echo "==> Iniciando gunicorn na porta 5000..."
exec gunicorn \
  --bind 0.0.0.0:5000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout 120 \
  wsgi:app
