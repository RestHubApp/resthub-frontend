#!/usr/bin/env bash
# Regenera las líneas base visuales de Chromium (escritorio y celular) dentro
# de la imagen oficial de Playwright, el mismo entorno del job `visual` del CI.
# Así las capturas no dependen de las fuentes ni del rasterizador de tu máquina.
#
#   pnpm test:visual:update                  regenera las líneas base
#   bash scripts/visual-docker.sh --check    compara sin escribir (como el CI)
#
# Necesita docker o podman con el servicio activo, y el repositorio del backend
# (E2E_BACKEND_DIR, por omisión ../resthub-backend, con la rama develop).
# Revisa las diferencias con `git diff --stat e2e/visual/baselines` y mira las
# imágenes cambiadas antes de versionarlas.
set -euo pipefail

cd "$(dirname "$0")/.."
RAIZ="$PWD"
BACKEND="$(cd "${E2E_BACKEND_DIR:-../resthub-backend}" && pwd)"
VERSION="$(node -p "require('playwright/package.json').version")"
IMAGEN="mcr.microsoft.com/playwright:v${VERSION}-noble"

MOTOR="${CONTAINER_ENGINE:-}"
if [[ -z "$MOTOR" ]]; then
  for candidato in docker podman; do
    if command -v "$candidato" > /dev/null && "$candidato" info > /dev/null 2>&1; then MOTOR="$candidato"; break; fi
  done
fi
if [[ -z "$MOTOR" ]]; then
  echo "No hay docker ni podman en marcha. Genera las líneas base con el workflow «Líneas base visuales» (ver e2e/README.md)." >&2
  exit 1
fi

ARGS="--update-snapshots"
[[ "${1:-}" == "--check" ]] && ARGS=""

echo "Motor: $MOTOR. Imagen: $IMAGEN"
# node_modules y el entorno de Python viven en volúmenes propios: los de tu
# máquina son de otro sistema operativo.
exec "$MOTOR" run --rm --ipc=host --init \
  -v "$RAIZ:/work" \
  -v "$BACKEND:/backend" \
  -v resthub-visual-node-modules:/work/node_modules \
  -v resthub-visual-venv:/venv \
  -w /work \
  -e CI=1 -e E2E_BACKEND_DIR=/backend -e E2E_DB=/tmp/e2e.db \
  -e UV_PROJECT_ENVIRONMENT=/venv -e VISUAL_ARGS="$ARGS" \
  "$IMAGEN" bash -c '
    set -euo pipefail
    npm install -g "pnpm@$(node -p "require(\"./package.json\").packageManager.split(\"@\")[1]")" > /dev/null
    curl -LsSf https://astral.sh/uv/install.sh | sh > /dev/null
    export PATH="$HOME/.local/bin:$PATH"
    pnpm install --frozen-lockfile
    uv sync --frozen --python 3.12 --directory /backend
    bash e2e/server/backend.sh --prepare
    E2E_DB_PREPARED=1 pnpm test:visual:ci $VISUAL_ARGS
  '
