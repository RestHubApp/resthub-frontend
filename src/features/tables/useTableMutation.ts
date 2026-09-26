import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tablesQuery, tablesQueryKey } from '../../api/tables'
import type { TableState } from '../../api/types'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

interface TableMutationOptions<TVariables, TResult> {
  readonly mutationFn: (variables: TVariables) => Promise<TResult>
  readonly failure: string
  readonly success?: string
  readonly onSuccess?: () => void
  /** Cómo quedan las mesas con la respuesta del servidor, sin esperar a releerlas. */
  readonly updateCache?: (tables: readonly TableState[], result: TResult) => TableState[]
  /** El formulario muestra el error junto a sus campos: no hace falta el aviso. */
  readonly inlineError?: boolean
}

/**
 * Un cambio en las mesas: pone la respuesta del servidor en la lista, la
 * relee de fondo (el salón del mesero incluido) y, si falla, muestra lo que
 * dijo el servidor ("ya hay una mesa con ese nombre", "la mesa tiene un pedido").
 */
export function useTableMutation<TVariables, TResult>({
  mutationFn,
  failure,
  success,
  onSuccess,
  updateCache,
  inlineError = false,
}: TableMutationOptions<TVariables, TResult>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn,
    onSuccess: (resultado) => {
      if (updateCache !== undefined) {
        queryClient.setQueryData(tablesQuery(true).queryKey, (mesas) => mesas && updateCache(mesas, resultado))
      }
      void queryClient.invalidateQueries({ queryKey: tablesQueryKey })
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
