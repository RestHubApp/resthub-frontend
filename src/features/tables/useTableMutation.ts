import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tablesQueryKey } from '../../api/tables'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

interface TableMutationOptions<TVariables, TResult> {
  readonly mutationFn: (variables: TVariables) => Promise<TResult>
  readonly failure: string
  readonly success?: string
  readonly onSuccess?: () => void
  /** El formulario muestra el error junto a sus campos: no hace falta el aviso. */
  readonly inlineError?: boolean
}

/**
 * Un cambio en las mesas: refresca la lista y, si falla, muestra lo que dijo
 * el servidor ("ya hay una mesa con ese nombre", "la mesa tiene un pedido").
 */
export function useTableMutation<TVariables, TResult>({
  mutationFn,
  failure,
  success,
  onSuccess,
  inlineError = false,
}: TableMutationOptions<TVariables, TResult>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tablesQueryKey })
      if (success !== undefined) {
        push({ tone: 'info', message: success })
      }
      onSuccess?.()
    },
    onError: (error) => {
      if (inlineError) {
        return
      }
      push({ tone: 'warning', message: errorMessage(error, failure) })
    },
  })
}
