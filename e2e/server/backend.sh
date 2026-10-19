#!/usr/bin/env bash
# Levanta el backend de RestHub para las pruebas E2E: una base SQLite propia,
# recién migrada y sembrada con `seed_dev.py`, y uvicorn en el puerto 8201.
#
# E2E_BACKEND_DIR  carpeta del repositorio resthub-backend (por omisión, ../resthub-backend)
# E2E_DB           archivo SQLite que se borra y se vuelve a crear en cada arranque
#
# E2E_SEED_HISTORY=1 agrega sesenta días de historia sintética (`seed_history.py`)
# para que el panel de indicadores tenga gráficos; lo usa la revisión de accesibilidad.
#
# `backend.sh --prepare` solo migra y siembra; con E2E_DB_PREPARED=1 el
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
# Todas las pruebas salen de la misma IP: el límite por IP del backend las cortaría.
export RATE_LIMIT_PER_MINUTE=0
# La contraseña confirmada al entrar por el API (RFS-21) vale toda la corrida:
# las pruebas que no tratan de eso no pasan por «Confirma tu contraseña».
export REAUTHENTICATION_WINDOW_SECONDS=7200
# La verificación en dos pasos es obligatoria para la plataforma (RFS-22): las
# pruebas de la plataforma entran sin ella, con la cuenta de la semilla.
export PLATFORM_TWO_FACTOR_REQUIRED=false
export CORS_ALLOWED_ORIGINS="[\"$FRONT\"]"
export FRONTEND_BASE_URL="$FRONT"

cd "$BACKEND_DIR"
if [[ "${E2E_DB_PREPARED:-0}" != "1" ]]; then
  mkdir -p "$(dirname "$DB")"
  rm -f "$DB" "$DB-journal" "$DB-wal" "$DB-shm"
  uv run --frozen alembic upgrade head
  uv run --frozen python scripts/seed_dev.py
  if [[ "${E2E_SEED_HISTORY:-0}" == "1" ]]; then uv run --frozen python scripts/seed_history.py; fi
  # Modo WAL: una lectura larga (el canal de avisos, un listado) no bloquea a
  # quien escribe. Con el diario por omisión, varias pruebas en paralelo
  # terminaban en «database is locked». El modo queda guardado en el archivo.
  uv run --frozen python -c "import sqlite3, sys; sqlite3.connect(sys.argv[1]).execute('PRAGMA journal_mode=WAL')" "$DB"
fi
if [[ "${1:-}" == "--prepare" ]]; then
  exit 0
fi
exec uv run --frozen uvicorn resthub.main:app --host 127.0.0.1 --port "$PORT"
