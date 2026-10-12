// El caché donde el service worker guarda cada pantalla la primera vez que se
// pide (`runtimeCaching` en vite.config.ts usa este mismo nombre).
const SCREENS_CACHE = 'resthub-pantallas-visitadas'

const SCRIPT = /\/assets\/[^/]+\.js$/u

/**
 * Guarda en el caché de pantallas los archivos que la página ya descargó antes
 * de que el service worker tomara el control (los de la primera visita), y que
 * por eso no pasaron por él. Sin esto, la pantalla en que cayó la persona no
 * estaría sin señal hasta la siguiente carga. Los del armazón, que el service
 * worker ya precacheó, se dejan.
 */
export async function cacheLoadedScripts(): Promise<void> {
  if (!('caches' in globalThis)) {
    return
  }
  const loaded = performance
    .getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((url) => SCRIPT.test(url))
  const cached = await Promise.all(loaded.map((url) => caches.match(url)))
  const missing = loaded.filter((_, index) => cached[index] === undefined)
  await (await caches.open(SCREENS_CACHE)).addAll(missing)
}
