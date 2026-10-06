import { type Query, useQueryClient } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'

import { errorMessage } from '../services/api'
import { apiFailureMessage, clearApiFailure, subscribeApiFailure } from '../services/apiFailure'

/** Errores de consultas visibles, o el último corte si esta pantalla no consulta. */
export function useFailedQueries(scope: 'platform' | 'restaurant') {
  const client = useQueryClient()
  const cache = client.getQueryCache()
  const subscribe = useCallback((notify: () => void) => {
    const dejarCache = cache.subscribe(notify)
    const dejarCorte = subscribeApiFailure(notify)
    return () => {
      dejarCache()
      dejarCorte()
    }
  }, [cache])
  const belongs = useCallback((key: readonly unknown[]) =>
    (key[0] === 'platform') === (scope === 'platform'), [scope])
  // Una lectura de fondo (`meta.background`) que falla no avisa: no hay nada
  // en pantalla que dependa de ella. El reintento sí la vuelve a pedir.
  const visible = useCallback((query: Query) =>
    belongs(query.queryKey) && query.isActive() && query.state.status === 'error' && query.meta?.background !== true, [belongs])
  const snapshot = useCallback(() => {
    const activas = cache.getAll()
      .filter(visible)
      .map((query) => `${query.queryHash}:${String(query.state.errorUpdatedAt)}`).join('|')
    return `${activas}#${apiFailureMessage(scope) ?? ''}`
  }, [cache, visible, scope])
  const failed = useSyncExternalStore(subscribe, snapshot, snapshot)
  const first = failed.startsWith('#') ? undefined : cache.getAll().find(visible)
  const latente = apiFailureMessage(scope)
  return {
    message: first
      ? errorMessage(first.state.error, 'No se pudieron cargar los datos. Comprueba la conexión e inténtalo de nuevo.')
      : latente,
    retry: () => {
      clearApiFailure()
      void client.refetchQueries({ type: 'active', predicate: (query) => belongs(query.queryKey) && query.state.status === 'error' })
    },
  }
}
