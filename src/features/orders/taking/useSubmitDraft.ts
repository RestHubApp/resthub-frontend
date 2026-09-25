import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { addOrderItems, advanceOrder, openOrder, ordersQueryKey } from '../../../api/orders'
import { tablesQueryKey } from '../../../api/tables'
import type { NewItemRequest, OrderResponse } from '../../../api/types'
import { errorMessage } from '../../../services/api'
import { useNotifications } from '../../../store/notifications'
import { draftKey, type OrderTarget } from './orderTarget'
import { type DraftLine, toNewItems, useDraftActions } from './useOrderDraft'

/** El pedido se creo pero la cocina no lo recibio: queda abierto para reintentar. */
class NotSentError extends Error {
  readonly order: OrderResponse
  readonly cause: unknown

  constructor(order: OrderResponse, cause: unknown) {
    super('El pedido quedó abierto.')
    this.order = order
    this.cause = cause
  }
}

async function openAndSend(target: OrderTarget, items: NewItemRequest[]): Promise<OrderResponse> {
  const order = await openOrder(
    target.kind === 'table'
      ? { type: 'dine_in', table_id: target.tableId, customer_name: '', notes: '', items }
      : {
          type: 'takeaway',
          customer_name: target.kind === 'takeaway' ? target.customerName : '',
          notes: '',
          items,
        },
  )
  try {
    return await advanceOrder(order.id, 'send')
  } catch (error) {
    throw new NotSentError(order, error)
  }
}

function successMessage(target: OrderTarget, order: OrderResponse): string {
  return target.kind === 'add'
    ? `Platos agregados al pedido #${String(order.number)}.`
    : `Pedido #${String(order.number)} enviado a cocina.`
}

/**
 * Manda el borrador: abre el pedido y lo envia a cocina, o agrega los platos a uno existente.
 *
 * Abrir y enviar son dos llamadas. Si la segunda falla, el pedido ya existe
 * abierto: se lleva al mesero a su detalle, donde puede reintentar el envio,
 * en vez de dejarle un borrador que duplicaria el pedido.
 */
export function useSubmitDraft(target: OrderTarget) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const push = useNotifications((state) => state.push)
  const { clear } = useDraftActions()
  const key = draftKey(target)

  const refrescar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
      queryClient.invalidateQueries({ queryKey: tablesQueryKey }),
    ])

  return useMutation({
    mutationFn: (lines: readonly DraftLine[]) => {
      const items = toNewItems(lines)
      return target.kind === 'add' ? addOrderItems(target.orderId, items) : openAndSend(target, items)
    },
    onSuccess: async (order) => {
      clear(key)
      await refrescar()
      push({ tone: 'info', message: successMessage(target, order) })
      await navigate(target.kind === 'add' ? `/pedidos/${String(order.id)}` : '/pedidos')
    },
    onError: async (error) => {
      if (!(error instanceof NotSentError)) {
        push({ tone: 'warning', message: errorMessage(error, 'No se pudo guardar el pedido.') })
        return
      }
      clear(key)
      await refrescar()
      push({
        tone: 'warning',
        message: `El pedido #${String(error.order.number)} quedó abierto sin enviar: ${errorMessage(error.cause, 'reintenta desde su detalle.')}`,
      })
      await navigate(`/pedidos/${String(error.order.id)}`)
    },
  })
}
