import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { ordersQueryKey } from '@/api/orders'
import { tablesQueryKey } from '@/api/tables'
import { errorMessage } from '@/services/api'
import { paths } from '@/services/paths'
import { useNotifications } from '@/store/notifications'
import { ownerOf } from '@/store/offlineQueue'
import { useSession } from '@/store/session'
import { draftKey, type OrderTarget } from './orderTarget'
import { NotSentError, QUEUED, sendDraft, successMessage } from './submitDraft'
import { type DraftLine, useDraftActions } from './useOrderDraft'

/**
 * Manda el borrador: abre el pedido y lo envia a cocina, o agrega los platos a uno existente.
 *
 * Abrir y enviar son dos llamadas. Si la segunda falla, el pedido ya existe
 * abierto: se lleva al mesero a su detalle, donde puede reintentar el envio,
 * en vez de dejarle un borrador que duplicaria el pedido. Si ni la primera
 * llega (sin señal), el pedido nuevo se guarda en el celular y se envía solo
 * cuando vuelve la conexión, sin riesgo de duplicarse.
 */
export function useSubmitDraft(target: OrderTarget, label: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const push = useNotifications((state) => state.push)
  const { clear } = useDraftActions()
  const owner = ownerOf(useSession((state) => state.account))
  const key = draftKey(target)

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
      queryClient.invalidateQueries({ queryKey: tablesQueryKey }),
    ])

  return useMutation({
    // Sin señal, TanStack Query pausa las mutaciones (`networkMode: 'online'`)
    // y el botón quedaba en «Enviando…» hasta que volviera la conexión, sin
    // llegar nunca a la cola. Esta mutación decide ella misma qué hacer sin
    // señal: un pedido nuevo va a la cola y agregar platos avisa que falló.
    networkMode: 'always',
    mutationFn: (lines: readonly DraftLine[]) => sendDraft({ target, lines, label, owner }),
    onSuccess: async (order) => {
      clear(key)
      if (order === QUEUED) {
        push({ tone: 'warning', message: `Sin señal: el pedido de ${label} quedó guardado y se enviará solo.` })
        await navigate(paths.orders.list)
        return
      }
      await refresh()
      push({ tone: 'info', message: successMessage(target, order) })
      await navigate(target.kind === 'add' ? paths.orders.detail(order.id) : paths.orders.list)
    },
    onError: async (error) => {
      if (!(error instanceof NotSentError)) {
        push({ tone: 'warning', message: errorMessage(error, 'No se pudo guardar el pedido.') })
        return
      }
      clear(key)
      await refresh()
      push({
        tone: 'warning',
        message: `El pedido #${String(error.order.number)} quedó abierto sin enviar: ${errorMessage(error.cause, 'reintenta desde su detalle.')}`,
      })
      await navigate(paths.orders.detail(error.order.id))
    },
  })
}
