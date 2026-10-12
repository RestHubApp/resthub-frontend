#!/usr/bin/env bash
# Regenera las fuentes de la interfaz en src/assets/fonts/:
#   - geist-latin-wght.woff2                  (la de siempre)
#   - atkinson-latin-wght.woff2               (Atkinson Hyperlegible Next, de «Apariencia»)
#   - lexend-latin-wght.woff2                 (Lexend, de «Apariencia»)
#
# Parte de la fuente variable (latin) de cada paquete de @fontsource-variable y
# le quita lo que la interfaz no usa:
#   - los pesos por debajo de 400 (el más fino que se usa es `font-normal`);
#     arriba, hasta donde llegue la fuente (Geist y Lexend 900; Atkinson 800);
#   - los glifos fuera de ASCII, Latin-1 (tildes, ñ, ¡, ¿, ×, ·), las comillas y
#     los guiones tipográficos, la viñeta, los puntos suspensivos, € y el menos.
# Conserva todas las características OpenType (`tnum`, para los montos).
# Un carácter fuera de ese conjunto se dibuja con la fuente de respaldo.
#
# Uso:  bash scripts/subsetFont.sh        (necesita `uv`; no hay que instalar nada más)
set -euo pipefail

UNICODES="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2022,U+2026,U+20AC,U+2212"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# paquete | archivo de origen | archivo de destino | pesos
FONTS=(
  "geist|geist-latin-wght-normal.woff2|geist-latin-wght.woff2|400:900"
  "atkinson-hyperlegible-next|atkinson-hyperlegible-next-latin-wght-normal.woff2|atkinson-latin-wght.woff2|400:800"
  "lexend|lexend-latin-wght-normal.woff2|lexend-latin-wght.woff2|400:900"
)

for spec in "${FONTS[@]}"; do
  IFS='|' read -r package source target weights <<<"$spec"
  uvx --from fonttools --with brotli fonttools varLib.instancer \
    "node_modules/@fontsource-variable/$package/files/$source" "wght=$weights" -o "$WORK/limited.woff2"
  uvx --from fonttools --with brotli pyftsubset "$WORK/limited.woff2" \
    --unicodes="$UNICODES" --flavor=woff2 --layout-features='*' --output-file="src/assets/fonts/$target"
  ls -l "src/assets/fonts/$target"
done
