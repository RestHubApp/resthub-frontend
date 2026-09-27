#!/usr/bin/env bash
# Levanta el backend de RestHub para las pruebas E2E: una base SQLite propia,
# recién migrada y sembrada con `seed_dev.py`, y uvicorn en el puerto 8201.
#
# E2E_BACKEND_DIR  carpeta del repositorio resthub-backend (por omisión, ../resthub-backend)
# E2E_DB           archivo SQLite que se borra y se vuelve a crear en cada arranque
#
# `backend.sh --preparar` solo migra y siembra; con E2E_DB_PREPARADA=1 el
# arranque usa esa base tal cual (así lo hace el CI, en pasos separados).
set -euo pipefail

BACKEND_DIR="${E2E_BACKEND_DIR:-../resthub-backend}"
DB="${E2E_DB:-/tmp/resthub-e2e/e2e.db}"
PORT="${E2E_BACKEND_PORT:-8201}"
FRONT="${E2E_FRONT_ORIGIN:-http://localhost:5201}"


export DATABASE_URL="sqlite+aiosqlite:///$DB"
export DEBUG=true LOG_JSON=false
export JWT_SECRET_KEY="pruebas-locales-solo-desarrollo-000000000000"
export OPENROUTER_API_KEY="" TYPESAFE_API_KEY=""
export CORS_ALLOWED_ORIGINS="[\"$FRONT\"]"
export FRONTEND_BASE_URL="$FRONT"

cd "$BACKEND_DIR"
if [[ "${E2E_DB_PREPARADA:-0}" != "1" ]]; then
  mkdir -p "$(dirname "$DB")"
  rm -f "$DB" "$DB-journal" "$DB-wal" "$DB-shm"
  uv run --frozen alembic upgrade head
  uv run --frozen python scripts/seed_dev.py
fi
if [[ "${1:-}" == "--preparar" ]]; then
  exit 0
fi
exec uv run --frozen uvicorn resthub.main:app --host 127.0.0.1 --port "$PORT"
