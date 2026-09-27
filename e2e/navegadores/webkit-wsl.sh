#!/bin/sh
# Lanza el WebKit de Playwright en un Linux sin las librerías del sistema que
# pide (WSL sin root). El envoltorio que trae Playwright pisa LD_LIBRARY_PATH;
# este agrega al final la carpeta de E2E_EXTRA_LIBS, donde se extrajeron con
# `apt-get download` + `dpkg-deb -x` las que faltaban. Se usa con
# E2E_WEBKIT_EXECUTABLE=e2e/navegadores/webkit-wsl.sh (ver e2e/README.md).
D="$(ls -d "${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"/webkit-*/minibrowser-wpe | tail -1)"
export WEBKIT_EXEC_PATH="$D/bin"
export WEBKIT_INJECTED_BUNDLE_PATH="$D/lib"
export WEBKIT_INSPECTOR_RESOURCES_PATH="$D/share"
export LD_LIBRARY_PATH="$D/lib:$D/sys/lib:${E2E_EXTRA_LIBS:-}"
export WEBKIT_FORCE_COMPLEX_TEXT=1
exec "$D/bin/MiniBrowser" "$@"
