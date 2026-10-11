import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { isSessionCode } from '@/services/apiError'
import { apiUrl } from '@/services/apiRouting'
import { EventStreamError, readEventStream } from '@/services/eventStream'
import { logger } from '@/services/logger'
import { useSession } from '@/store/session'
import { createLiveEventHandler } from './liveEvents'

/** `connecting` al abrir, `live` con el canal activo, `offline` mientras reintenta. */
export type LiveStatus = 'connecting' | 'live' | 'offline'

// El mismo plazo que anuncia el servidor en el aviso `ready`.
const RETRY_MS = 3000

const liveLogger = logger.child({ module: 'realtime' })

/**
 * Mantiene en vivo los pedidos, las mesas y la carta mientras la pantalla esta abierta.
 *
 * Abre el canal de avisos del servidor y, si se corta, reintenta cada tres
 * segundos. Al reconectar vuelve a pedir pedidos, mesas y carta: pudo perderse un aviso en el
 * corte. Un 401 no se reintenta: la credencial ya no vale.
 */
export function useLiveUpdates(): LiveStatus {
  const token = useSession((state) => state.token)
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<LiveStatus>('connecting')

  useEffect(() => {
    // eslint-disable-next-line security/detect-possible-timing-attacks -- compara con null, no con un secreto: el cliente no verifica credenciales
    if (token === null) {
      return undefined
    }
    const controller = new AbortController()
    const retry: { timer: number | undefined } = { timer: undefined }
    const onEvent = createLiveEventHandler(queryClient, () => {
      setStatus('live')
    })

    const scheduleRetry = (error?: unknown) => {
      if (controller.signal.aborted) {
        return
      }
      setStatus('offline')
      if (error instanceof EventStreamError && isSessionCode(error.code)) {
        return
      }
      liveLogger.warn({ err: error }, 'realtime.disconnected')
      retry.timer = window.setTimeout(connect, RETRY_MS)
    }

    function connect(): void {
      readEventStream({
        url: apiUrl('/events'),
        token: token ?? '',
        signal: controller.signal,
        onEvent,
      }).then(() => {
        scheduleRetry()
      }, scheduleRetry)
    }

    connect()
    return () => {
      controller.abort()
      window.clearTimeout(retry.timer)
    }
  }, [token, queryClient])

  return status
}
