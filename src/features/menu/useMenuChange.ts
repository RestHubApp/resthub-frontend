import { useMutation, useQueryClient } from '@tanstack/react-query'

import { menuQueryKey } from '../../api/menu'
import type { MenuResponse } from '../../api/types'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'
import { MENU_KEY } from './useMenuData'

interface MenuChange<TVars> {
  readonly send: (vars: TVars) => Promise<unknown>
  /** Cómo queda la carta en caché mientras el servidor responde. */
  readonly preview: (menu: MenuResponse, vars: TVars) => MenuResponse
  /** El aviso si el servidor lo rechaza. El `detail` del servidor tiene prioridad. */
  readonly failure: string
}

/**
 * Un cambio de la carta que se ve al instante.
 *
 * Marcar un plato como agotado o subirlo un lugar es algo que se hace muchas
 * veces seguidas por la mañana: esperar al servidor en cada toque se siente
 * lento. Se muestra el cambio, se envía, y si falla se vuelve atrás con un
 * aviso que explica por qué.
 */
export function useMenuChange<TVars>({ send, preview, failure }: MenuChange<TVars>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: send,
    onMutate: async (vars: TVars) => {
      await queryClient.cancelQueries({ queryKey: MENU_KEY })
      const previo = queryClient.getQueryData<MenuResponse>(MENU_KEY)
      if (previo !== undefined) {
        queryClient.setQueryData<MenuResponse>(MENU_KEY, preview(previo, vars))
      }
      return { previo }
    },
    onError: (error, _vars, contexto) => {
      if (contexto?.previo !== undefined) {
        queryClient.setQueryData(MENU_KEY, contexto.previo)
      }
      push({ tone: 'warning', message: errorMessage(error, failure) })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: menuQueryKey }),
  })
}
