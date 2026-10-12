import { cashQueryKey, currentCashQueryKey } from '@/api/cash'
import type { CashSession, CurrentCash } from '@/api/types'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

interface CashMutationOptions<TVariables> {
  readonly mutationFn: (variables: TVariables) => Promise<CashSession>
  readonly success: (session: CashSession) => string
  readonly failure: string
  readonly onSuccess?: (session: CashSession) => void
}

/**
 * Abrir o cerrar la caja: pone el turno que devolvió el servidor en la
 * consulta de la caja actual y relee el resto (el historial) de fondo.
 */
export function useCashMutation<TVariables>({ mutationFn, success, failure, onSuccess }: CashMutationOptions<TVariables>) {
  return useNotifiedMutation({
    mutationFn,
    success,
    failure,
    updateCache: (queryClient, session) => {
      const actual: CurrentCash = session.is_open ? { is_open: true, session } : { is_open: false, session: null }
      queryClient.setQueryData(currentCashQueryKey, actual)
    },
    invalidate: [cashQueryKey],
    ...(onSuccess === undefined ? {} : { onSuccess }),
  })
}
