#!/usr/bin/env bash
# Regenera src/assets/fonts/geist-latin-wght.woff2, la fuente de la interfaz.
#
# Parte de la Geist variable (latin) de @fontsource-variable/geist y le quita lo
# que la interfaz no usa:
#   - los pesos por debajo de 400 (el más fino que se usa es `font-normal`; el
#     más grueso, `font-black` en la marca, es 900);
#   - los glifos fuera de ASCII, Latin-1 (tildes, ñ, ¡, ¿, ×, ·), las comillas y
#     los guiones tipográficos, la viñeta, los puntos suspensivos, € y el menos.
# Conserva todas las características OpenType (`tnum`, para los montos).
# Un carácter fuera de ese conjunto se dibuja con la fuente de respaldo.
#
# Uso:  bash scripts/subsetFont.sh        (necesita `uv`; no hay que instalar nada más)
set -euo pipefail

SOURCE="node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"
TARGET="src/assets/fonts/geist-latin-wght.woff2"
UNICODES="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2022,U+2026,U+20AC,U+2212"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

uvx --from fonttools --with brotli fonttools varLib.instancer "$SOURCE" "wght=400:900" -o "$WORK/limited.woff2"
uvx --from fonttools --with brotli pyftsubset "$WORK/limited.woff2" \
  --unicodes="$UNICODES" --flavor=woff2 --layout-features='*' --output-file="$TARGET"
ls -l "$TARGET"
