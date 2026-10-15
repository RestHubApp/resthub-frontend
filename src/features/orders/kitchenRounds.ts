import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { isActive } from './orderLabels'

// Las rondas de cocina: cada vez que se agregan platos a un pedido que ya
// salió a cocina, el pedido sube de ronda y esos platos llegan con ella. La
// cocina tiene que ver de un vistazo qué es nuevo y qué ya estaba preparando.

/** Si el plato se anuló después de enviarlo a cocina: sigue en el pedido, pero no se prepara ni se cobra. */
export function isVoided(item: OrderItemResponse): boolean {
  return item.voided_at !== null
}

/** Los platos que siguen en pie: sin los anulados. */
export function liveItems(order: OrderResponse): OrderItemResponse[] {
  return order.items.filter((item) => !isVoided(item))
}

/** Si el plato llegó en la última ronda de un pedido que ya había ido a cocina antes. */
export function isNewItem(order: OrderResponse, item: OrderItemResponse): boolean {
  return order.kitchen_round > 1 && item.kitchen_round === order.kitchen_round
}

/** Los platos de un pedido separados por ronda. */
export interface KitchenRounds {
  /** La ronda vigente y sus platos; `null` si no hay platos agregados después del primer envío. */
  readonly added: { readonly round: number; readonly items: readonly OrderItemResponse[] } | null
  /** Lo que ya se había enviado antes; sin ronda nueva, todos los platos. */
  readonly sent: readonly OrderItemResponse[]
}

export function kitchenRounds(order: OrderResponse): KitchenRounds {
  const added = order.items.filter((item) => isNewItem(order, item))
  if (added.length === 0) {
    return { added: null, sent: order.items }
  }
  return {
    added: { round: order.kitchen_round, items: added },
    sent: order.items.filter((item) => !isNewItem(order, item)),
  }
}

/**
 * Si el pedido admite anular platos: en curso, ya salido de «abierto» (antes
 * se quita el plato) y sin pagos, como exige el servidor.
 */
export function canVoidItems(order: OrderResponse): boolean {
  return isActive(order.status) && order.status !== 'open' && order.payments.length === 0
}
