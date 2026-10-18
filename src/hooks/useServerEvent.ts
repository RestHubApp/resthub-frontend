import { useEffect, useRef, useSyncExternalStore } from 'react'

import { currentAuthToken, subscribeAuthToken } from '@/services/apiCredentials'
import { isDenied } from '@/services/apiError'
import { apiUrl } from '@/services/apiRouting'
import { EventStreamError, readEventStream } from '@/services/eventStream'
import { logger } from '@/services/logger'

const RETRY_MS = 3000

const eventLogger = logger.child({ module: 'realtime' })


/**
 * Escucha un tema del canal de avisos del servidor (`GET /events`) mientras
 * el componente está en pantalla.
 *
 * Si el canal se corta, reintenta cada tres segundos; un 401 o 403 no se
 * reintenta porque la credencial no va a mejorar sola. `onEvent` puede
 * cambiar en cada render sin reabrir la conexión. Se abre cuando hay token
 * (tras recargar, al recuperarlo de la cookie) y se reabre con el renovado.
 */
export function useServerEvent(topic: string, onEvent: (data: string) => void, enabled = true): void {
  const callback = useRef(onEvent)
  useEffect(() => {
    callback.current = onEvent
  })

  // La capa de hooks no puede leer el almacén de sesión: el token lo da el cliente HTTP.
  const token = useSyncExternalStore(subscribeAuthToken, currentAuthToken)

  useEffect(() => {
    if (!enabled || token === null) {
      return undefined
    }
    const credential = token
    const controller = new AbortController()
    let timer: number | undefined

    const retry = (error?: unknown) => {
      if (controller.signal.aborted) {
        return
      }
      if (error instanceof EventStreamError && isDenied(error.code)) {
        return
      }
      eventLogger.warn({ err: error, topic }, 'realtime.disconnected')
      timer = window.setTimeout(connect, RETRY_MS)
    }

    function connect(): void {
      readEventStream({
        url: apiUrl('/events'),
        token: credential,
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === topic) {
            callback.current(event.data)
          }
        },
      }).then(() => {
        retry()
      }, retry)
    }

    connect()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [topic, enabled, token])
}
