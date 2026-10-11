import { addOrderItems, advanceOrder, openOrder } from '@/api/orders'
import type { OpenOrderRequest, OrderResponse } from '@/api/types'
import { enqueueOrder, type QueueOwner } from '@/store/offlineQueue'
import { stepDoneMessage } from '@/features/orders/nextStep'
import { isOffline } from '@/features/orders/isOffline'
import { openRequest, type OrderTarget } from './orderTarget'
import { type DraftLine, toNewItems } from './useOrderDraft'

/** El pedido se creo pero la cocina no lo recibio: queda abierto para reintentar. */
export class NotSentError extends Error {
  readonly order: OrderResponse
  override readonly cause: unknown

  constructor(order: OrderResponse, cause: unknown) {
    super('El pedido quedó abierto.')
    this.order = order
    this.cause = cause
  }
}

/** Sin señal: el pedido quedó guardado en el celular y se envía solo al volver. */
export const QUEUED = 'en-cola'

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

export function successMessage(target: OrderTarget, order: OrderResponse): string {
  return target.kind === 'add'
    ? `Platos agregados al pedido #${String(order.number)}.`
    : stepDoneMessage(order)
}

interface SendDraftOptions {
  readonly target: OrderTarget
  readonly lines: readonly DraftLine[]
  readonly label: string
  readonly owner: QueueOwner | null
}

/**
 * Manda el borrador al servidor.
 *
 * Agregar platos a un pedido existente es una llamada; un pedido nuevo se abre
 * y se envia, o queda en la cola del celular si no hay señal. El `clientRequestId`
 * se genera aca: con el mismo valor el servidor no duplica un reintento.
 */
export function sendDraft({ target, lines, label, owner }: SendDraftOptions): Promise<OrderResponse | typeof QUEUED> {
  const items = toNewItems(lines)
  return target.kind === 'add'
    ? addOrderItems(target.orderId, items)
    : openOrQueue(openRequest(target, items, crypto.randomUUID()), label, owner)
}
