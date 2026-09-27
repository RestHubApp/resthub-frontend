# Pruebas de extremo a extremo y de regresión visual (Playwright)

| Comando | Qué hace |
|---|---|
| `pnpm test:e2e` | Inventario de interfaz (`cobertura`) y E2E en Chromium: escritorio 1366 × 900 y celular 390 × 844 (pruebas `@movil`). Corre en el CI (job `e2e`). |
| `pnpm test:visual` | Regresión visual en Chromium, Firefox y WebKit, escritorio y celular. Solo en local. |
| `pnpm test:visual --update-snapshots` | Regenera las líneas base (`e2e/visual/lineas-base/<proyecto>/`) después de un cambio visual aprobado. |
| `pnpm e2e:inventario` | Reescribe `e2e/cobertura-ui.json` desde el código. |

- `webServer` levanta el backend con `e2e/servidor/backend.sh` (base SQLite propia, migrada, sembrada con `seed_dev` y en modo WAL, puerto 8201) y la compilación de producción del frontend (puerto 5201). `E2E_BACKEND_DIR` apunta al repositorio del backend (por omisión `../resthub-backend`).
- Cada prueba da de alta su propio restaurante por el API de plataforma (`soporte/api.ts`): las pruebas corren en paralelo y repetidas sin compartir datos.
- **Inventario de interfaz.** `cobertura-ui.json` lista cada ruta del router, cada overlay del código (FormDialog, ConfirmDialog, Sheet, Tabs, desplegables) y las funciones, estados y vistas por rol de `inventario/funciones/*.json`. Cada prueba marca lo que recorre con `cubre('…')`; `cobertura.spec.ts` falla si algo queda sin prueba E2E o sin captura visual.
- **Las líneas base visuales dependen del sistema operativo** (fuentes y rasterizador): se generaron en WSL2 con Ubuntu 26.04. En otra máquina se regeneran y se revisan antes de versionarlas; por eso la regresión visual no está en el CI.
- **WSL sin root.** Firefox y WebKit necesitan librerías del sistema que se pueden extraer sin `sudo` (`apt-get download <paquete>` y `dpkg-deb -x <deb> <carpeta>`) y exportar en `LD_LIBRARY_PATH`. El lanzador de WebKit de Playwright pisa esa variable: se usa `E2E_WEBKIT_EXECUTABLE=e2e/navegadores/webkit-wsl.sh` con `E2E_EXTRA_LIBS=<carpeta>/usr/lib/x86_64-linux-gnu`.
- Otras variables: `E2E_WORKERS`, `E2E_SALIDA` y `E2E_REPORTE` (carpetas propias para correr dos suites a la vez), `E2E_EVIDENCIAS` (capturas por paso), `E2E_BASE_URL` (probar otra compilación).
