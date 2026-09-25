import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dishCostsQueryKey } from '../../api/inventory'
import { menuQueryKey } from '../../api/menu'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

interface MenuAction {
  readonly send: () => Promise<unknown>
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
export function useMenuAction({ send, failure, success }: MenuAction) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: send,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: menuQueryKey }),
        queryClient.invalidateQueries({ queryKey: dishCostsQueryKey }),
      ])
      if (success !== undefined) {
        push({ tone: 'info', message: success })
      }
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, failure) })
    },
  })
}
