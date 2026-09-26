import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { addOrderItems, advanceOrder, openOrder, ordersQueryKey } from '../../../api/orders'
import { tablesQueryKey } from '../../../api/tables'
import type { OpenOrderRequest, OrderResponse } from '../../../api/types'
import { errorMessage } from '../../../services/api'
import { useNotifications } from '../../../store/notifications'
import { enqueueOrder, ownerOf, type QueueOwner } from '../../../store/offlineQueue'
import { useSession } from '../../../store/session'
import { stepDoneMessage } from '../nextStep'
import { isOffline } from '../offline/useOfflineOrders'
import { draftKey, openRequest, type OrderTarget } from './orderTarget'
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

/** Sin señal: el pedido quedó guardado en el celular y se envía solo al volver. */
const QUEUED = 'en-cola'

async function openAndSend(request: OpenOrderRequest): Promise<OrderResponse> {
  const order = await openOrder(request)
  try {
    return await advanceOrder(order.id, 'send')
  } catch (error) {
    throw new NotSentError(order, error)
  }
}

/** Abre y envía; si no hay señal, lo deja en la cola del celular. */
async function openOrQueue(
  request: OpenOrderRequest,
  label: string,
  owner: QueueOwner | null,
): Promise<OrderResponse | typeof QUEUED> {
  try {
    return await openAndSend(request)
  } catch (error) {
    if (error instanceof NotSentError || !isOffline(error) || owner === null) {
      throw error
    }
    enqueueOrder({ ...owner, request, label, queuedAt: new Date().toISOString() })
    return QUEUED
  }
}

function successMessage(target: OrderTarget, order: OrderResponse): string {
  return target.kind === 'add'
    ? `Platos agregados al pedido #${String(order.number)}.`
    : stepDoneMessage(order)
}

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

  const refrescar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
      queryClient.invalidateQueries({ queryKey: tablesQueryKey }),
    ])

  return useMutation({
    mutationFn: (lines: readonly DraftLine[]) => {
      const items = toNewItems(lines)
      return target.kind === 'add'
        ? addOrderItems(target.orderId, items)
        : openOrQueue(openRequest(target, items, crypto.randomUUID()), label, owner)
    },
    onSuccess: async (order) => {
      clear(key)
      if (order === QUEUED) {
        push({ tone: 'warning', message: `Sin señal: el pedido de ${label} quedó guardado y se enviará solo.` })
        await navigate('/pedidos')
        return
      }
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
