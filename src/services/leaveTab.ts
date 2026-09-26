// Lo que el navegador espera antes de dar por hecho que no dejó cerrar la pestaña.
const ESPERA_AL_CERRAR_MS = 200

/** Una ruta de la aplicación con su base (`import.meta.env.BASE_URL`), para salir de React Router. */
export function appUrl(path: string, base: string = import.meta.env.BASE_URL): string {
  const ruta = path.startsWith('/') ? path : '/' + path
  return base.replace(/\/$/u, '') + ruta
}

/**
 * Cierra esta pestaña o, si el navegador no lo deja, carga `path` desde cero.
 *
 * El navegador solo deja cerrar por código las pestañas que abrió un script
 * y que no navegaron. Si sigue abierta, se recarga la aplicación en `path`
 * en vez de navegar dentro de ella: así nada de lo que había en memoria
 * (sesión, caché) sigue ahí.
 */
export function closeTabOrGo(path: string): void {
  window.close()
  window.setTimeout(() => {
    window.location.replace(appUrl(path))
  }, ESPERA_AL_CERRAR_MS)
}
