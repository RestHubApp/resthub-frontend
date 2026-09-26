import { useMutation, useQueryClient } from '@tanstack/react-query'

import { cashQueryKey, currentCashQueryKey } from '../../api/cash'
import type { CashSession, CurrentCash } from '../../api/types'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

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
export function useCashMutation<TVariables>({
  mutationFn,
  success,
  failure,
  onSuccess,
}: CashMutationOptions<TVariables>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn,
    onSuccess: (session) => {
      const actual: CurrentCash = session.is_open ? { is_open: true, session } : { is_open: false, session: null }
      queryClient.setQueryData(currentCashQueryKey, actual)
      void queryClient.invalidateQueries({ queryKey: cashQueryKey })
      push({ tone: 'info', message: success(session) })
      onSuccess?.(session)
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, failure) })
    },
  })
}
