import { dishCostsQueryKey } from '@/api/inventory'
import { menuQueryKey } from '@/api/menu'
import type { MenuResponse } from '@/api/types'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'
import { MENU_KEY } from './useMenuData'

interface MenuAction<TResult> {
  readonly send: () => Promise<TResult>
  /** Cómo queda la carta con la respuesta del servidor, sin esperar a releerla. */
  readonly updateCache?: (menu: MenuResponse, result: TResult) => MenuResponse
  /** El aviso si el servidor lo rechaza. El `detail` del servidor tiene prioridad. */
  readonly failure: string
  readonly success?: string
}

/**
 * Una acción puntual sobre la carta: activar, desactivar o eliminar.
 *
 * Si el servidor la rechaza (un 409 al borrar una categoría con platos, por
 * ejemplo), el aviso muestra su explicación tal cual.
 */
export function useMenuAction<TResult>({ send, updateCache, failure, success }: MenuAction<TResult>) {
  return useNotifiedMutation({
    mutationFn: send,
    failure,
    ...(success === undefined ? {} : { success: () => success }),
    ...(updateCache === undefined
      ? {}
      : {
          updateCache: (queryClient, result: TResult) => {
            queryClient.setQueryData(MENU_KEY, (menu) => menu && updateCache(menu, result))
          },
        }),
    invalidate: [menuQueryKey, dishCostsQueryKey],
  })
}
