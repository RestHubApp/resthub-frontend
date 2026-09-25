import { useEffect, useRef } from 'react'

import { api } from '../services/api'
import { EventStreamError, readEventStream } from '../services/eventStream'
import { logger } from '../services/logger'

const RETRY_MS = 3000
const UNAUTHORIZED = 401
const FORBIDDEN = 403

const eventLogger = logger.child({ module: 'realtime' })

// La credencial ya viaja en cada petición de Axios; la capa de hooks no puede
// leer el almacén de sesión, así que la toma de ahí.
function currentToken(): string | null {
  const cabecera = api.defaults.headers.common.Authorization
  return typeof cabecera === 'string' ? cabecera.replace(/^Bearer /u, '') : null
}

/**
 * Escucha un tema del canal de avisos del servidor (`GET /events`) mientras
 * el componente está en pantalla.
 *
 * Si el canal se corta, reintenta cada tres segundos; un 401 o 403 no se
 * reintenta porque la credencial no va a mejorar sola. `onEvent` puede
 * cambiar en cada render sin reabrir la conexión.
 */
export function useServerEvent(topic: string, onEvent: (data: string) => void, enabled = true): void {
  const callback = useRef(onEvent)
  useEffect(() => {
    callback.current = onEvent
  })

  useEffect(() => {
    const token = currentToken()
    if (!enabled || token === null) {
      return undefined
    }
    const controller = new AbortController()
    let timer: number | undefined

    const reintentar = (error?: unknown) => {
      if (controller.signal.aborted) {
        return
      }
      if (error instanceof EventStreamError && (error.status === UNAUTHORIZED || error.status === FORBIDDEN)) {
        return
      }
      eventLogger.warn({ err: error, topic }, 'realtime.disconnected')
      timer = window.setTimeout(conectar, RETRY_MS)
    }

    function conectar(): void {
      readEventStream({
        url: `${api.defaults.baseURL ?? ''}/events`,
        token: token ?? '',
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === topic) {
            callback.current(event.data)
          }
        },
      }).then(() => {
        reintentar()
      }, reintentar)
    }

    conectar()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [topic, enabled])
}
