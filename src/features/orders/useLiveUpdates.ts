import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { currentUserQueryKey } from '../../api/auth'
import { ordersQueryKey } from '../../api/orders'
import { tablesQueryKey } from '../../api/tables'
import { api } from '../../services/api'
import { EventStreamError, readEventStream } from '../../services/eventStream'
import { logger } from '../../services/logger'
import { useSession } from '../../store/session'

/** `connecting` al abrir, `live` con el canal activo, `offline` mientras reintenta. */
export type LiveStatus = 'connecting' | 'live' | 'offline'

// El mismo plazo que anuncia el servidor en el aviso `ready`.
const RETRY_MS = 3000
const UNAUTHORIZED = 401
const MENU_KEY = ['menu'] as const

// Un aviso dice que cambio, nunca los datos: se invalidan las consultas y
// TanStack Query vuelve a pedir solo las que estan en pantalla.
const KEYS_BY_TOPIC: Readonly<Record<string, readonly (readonly unknown[])[]>> = {
  orders: [ordersQueryKey, tablesQueryKey],
  menu: [MENU_KEY],
  permissions: [currentUserQueryKey],
}
const EVERYTHING = [ordersQueryKey, tablesQueryKey, MENU_KEY] as const

const liveLogger = logger.child({ module: 'realtime' })

function invalidate(queryClient: QueryClient, keys: readonly (readonly unknown[])[]): void {
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey })
  }
}

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
    if (token === null) {
      return undefined
    }
    const controller = new AbortController()
    const retry: { timer: number | undefined; connected: boolean } = {
      timer: undefined,
      connected: false,
    }

    const onEvent = (event: { type: string }) => {
      if (event.type === 'ready') {
        setStatus('live')
        if (retry.connected) {
          invalidate(queryClient, EVERYTHING)
        }
        retry.connected = true
        return
      }
      invalidate(queryClient, KEYS_BY_TOPIC[event.type] ?? [])
    }

    const scheduleRetry = (error?: unknown) => {
      if (controller.signal.aborted) {
        return
      }
      setStatus('offline')
      if (error instanceof EventStreamError && error.status === UNAUTHORIZED) {
        return
      }
      liveLogger.warn({ err: error }, 'realtime.disconnected')
      retry.timer = window.setTimeout(connect, RETRY_MS)
    }

    function connect(): void {
      readEventStream({
        url: `${api.defaults.baseURL ?? ''}/events`,
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
