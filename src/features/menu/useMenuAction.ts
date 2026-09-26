import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dishCostsQueryKey } from '../../api/inventory'
import { menuQueryKey } from '../../api/menu'
import type { MenuResponse } from '../../api/types'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'
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
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: send,
    onSuccess: (resultado) => {
      if (updateCache !== undefined) {
        queryClient.setQueryData(MENU_KEY, (menu) => menu && updateCache(menu, resultado))
      }
      void queryClient.invalidateQueries({ queryKey: menuQueryKey })
      void queryClient.invalidateQueries({ queryKey: dishCostsQueryKey })
      if (success !== undefined) {
        push({ tone: 'info', message: success })
      }
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, failure) })
    },
  })
}
