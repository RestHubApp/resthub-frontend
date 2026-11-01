import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// El de `react-router/dom` es el que le pasa `flushSync` de react-dom al
// router. Sin el, la opcion `flushSync` de `navigate` se ignora en silencio.
import { RouterProvider } from 'react-router/dom'

// Primero: al cargarse elige el almacenamiento de la pestaña y saca de la barra
// el código de vista previa, antes de que el router lea la dirección.
import './services/tabStorage'
// Pone el tema, la letra y el tamaño de la cuenta en <html> antes de que React
// pinte: así la página no sale con un tema y salta a otro.
import '@/store/appearance'
import { router } from '@/router/routes'
import { logger, logUncaughtErrors } from './services/logger'
import { queryClient } from './services/queryClient'
import { registerServiceWorker } from './services/serviceWorker'
import './index.css'

logUncaughtErrors()
registerServiceWorker()

// Con backend en otro origen, se inicia DNS/TLS mientras React monta la
// pantalla. No se emite un preconnect vacío en desarrollo (API mismo origen).
const apiOrigin = import.meta.env.VITE_API_URL
if (apiOrigin !== undefined && apiOrigin !== '' && new URL(apiOrigin).origin !== location.origin) {
  const preconnect = document.createElement('link')
  preconnect.rel = 'preconnect'
  preconnect.href = new URL(apiOrigin).origin
  preconnect.crossOrigin = 'anonymous'
  document.head.append(preconnect)
}

const container = document.getElementById('root')

if (!container) {
  throw new Error('No se encontró el elemento #root en el documento.')
}

// React escribe estos errores en la consola por su cuenta. Pasarlos por el
// logger los deja con el mismo formato y nivel que el resto, junto con la pila
// de componentes, que es lo que dice en que pantalla ocurrio.
createRoot(container, {
  onUncaughtError: (error, info) => {
    logger.error({ err: error, componentStack: info.componentStack }, 'react.uncaught_error')
  },
  onCaughtError: (error, info) => {
    logger.error({ err: error, componentStack: info.componentStack }, 'react.caught_error')
  },
  onRecoverableError: (error, info) => {
    logger.warn({ err: error, componentStack: info.componentStack }, 'react.recoverable_error')
  },
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
