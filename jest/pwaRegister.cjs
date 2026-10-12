// Módulos virtuales de vite-plugin-pwa (`virtual:pwa-register*`). Solo existen
// dentro de Vite; en las pruebas el service worker no se registra.
module.exports = {
  registerSW: () => () => Promise.resolve(),
  useRegisterSW: () => ({
    needRefresh: [false, () => undefined],
    offlineReady: [false, () => undefined],
    updateServiceWorker: () => Promise.resolve(),
  }),
}
