import type { KeyValueStorage } from '@/services/tabStorage'

// Después de un despliegue, una pestaña abierta (o la PWA instalada) sigue con
// el `index.html` viejo y pide trozos que ya no existen. Vite avisa con
// `vite:preloadError`: se recarga la página una vez para tomar la versión nueva.

/** Cuándo se recargó la última vez por un trozo viejo, en el `sessionStorage` de la pestaña. */
export const STALE_CHUNK_RELOAD_KEY = 'resthub.trozo-viejo.recarga.v1'
/**
 * Si el trozo vuelve a faltar antes de este plazo, la recarga no lo arregló (el
 * archivo de verdad no está): no se recarga otra vez, para no entrar en bucle.
 */
export const STALE_CHUNK_RETRY_MS = 10_000

export interface StaleChunkPage {
  /** `null` si el navegador no deja usar `sessionStorage`. */
  readonly storage: KeyValueStorage | null
  readonly now: () => number
  readonly reload: () => void
}

/**
 * Recarga la página si no se recargó hace poco. Devuelve si lo hizo. Sin
 * almacenamiento no hay cómo saber si ya se intentó, así que no recarga.
 */
export function reloadForStaleChunk(page: StaleChunkPage): boolean {
  const { storage } = page
  if (storage === null) {
    return false
  }
  const now = page.now()
  try {
    const previous = storage.getItem(STALE_CHUNK_RELOAD_KEY)
    if (previous !== null && now - Number(previous) < STALE_CHUNK_RETRY_MS) {
      return false
    }
    storage.setItem(STALE_CHUNK_RELOAD_KEY, String(now))
  } catch {
    return false
  }
  page.reload()
  return true
}

function tabStorage(): KeyValueStorage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** Escucha `vite:preloadError` y recarga una vez; si no recarga, el error sigue su curso. */
export function reloadOnStaleChunks(page: StaleChunkPage = {
  storage: tabStorage(),
  now: () => Date.now(),
  reload: () => { window.location.reload() },
}): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForStaleChunk(page)) {
      event.preventDefault()
    }
  })
}
