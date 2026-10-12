import { tablesQuery, tablesQueryKey } from '@/api/tables'
import type { TableState } from '@/api/types'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

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
  return useNotifiedMutation({
    mutationFn,
    failure: inlineError ? undefined : failure,
    ...(success === undefined ? {} : { success: () => success }),
    ...(updateCache === undefined
      ? {}
      : {
          updateCache: (queryClient, result: TResult) => {
            queryClient.setQueryData(tablesQuery(true).queryKey, (tables) => tables && updateCache(tables, result))
          },
        }),
    invalidate: [tablesQueryKey],
    ...(onSuccess === undefined ? {} : { onSuccess: () => { onSuccess() } }),
  })
}
