import { logger } from './logger'

/**
 * Registra el service worker que genera vite-plugin-pwa (`sw.js`), solo en
 * producción y cuando la página terminó de cargar, como hacía el `registerSW.js`
 * que el plugin inyectaba en index.html: desde el archivo inicial es una
 * petición menos en la primera visita (unos 800 bytes, casi todo cabeceras).
 * En desarrollo no hay `sw.js`.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return
  }
  const base = import.meta.env.BASE_URL
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch((error: unknown) => {
      logger.warn({ err: error }, 'app.service_worker_registration_failed')
    })
  })
}
