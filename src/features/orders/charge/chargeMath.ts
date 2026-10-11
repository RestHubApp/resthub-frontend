import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { toCents } from '@/services/format'

// Las cuentas del cobro en céntimos, con las mismas reglas que el servidor.
// Sirven para mostrar cuánto se va a cobrar antes de mandarlo; el monto que
// vale es el que responde el servidor.

/** Cómo se cobra esta vez: lo que falta, una parte igual o los platos de alguien. */
export type SplitMode = 'all' | 'equal' | 'items'

const PERCENT = 100
const HALF = 0.5

/** Lo que falta pagar, en céntimos. */
export function balanceCents(order: OrderResponse): number {
  return toCents(order.balance)
}

/**
 * Una parte de lo que falta entre las personas que todavía no pagaron.
 *
 * Se redondea hacia abajo; la última persona paga lo que queda, con los
 * céntimos del redondeo, así la suma siempre da el total.
 */
export function equalPartCents(balance: number, remaining: number): number {
  if (remaining <= 1) {
    return balance
  }
  return Math.floor(balance / remaining)
}

function discountOf(cents: number, percent: number): number {
  // Medio céntimo hacia arriba, como `ROUND_HALF_UP` en el servidor.
  return Math.floor((cents * percent) / PERCENT + HALF)
}

/** Los platos que todavía nadie pagó. */
export function unpaidItems(order: OrderResponse): OrderItemResponse[] {
  return order.items.filter((item) => !item.is_paid)
}

/**
 * Lo que cuestan esos platos con el descuento del pedido.
 *
 * Si son todos los que faltan, es lo que falta: quien paga lo último cierra
 * la cuenta con el redondeo, igual que en el servidor.
 */
export function itemsCents(order: OrderResponse, itemIds: readonly number[]): number {
  const selected = new Set(itemIds)
  const pending = unpaidItems(order)
  if (pending.length > 0 && pending.every((item) => selected.has(item.id))) {
    return balanceCents(order)
  }
  const due = pending
    .filter((item) => selected.has(item.id))
    .reduce((sum, item) => sum + (item.is_courtesy ? 0 : toCents(item.subtotal)), 0)
  return due - discountOf(due, Number(order.discount_percent))
}

/** Lo que define este pago: el pedido, el modo, entre cuántos y qué platos. */
export interface ChargeRequest {
  readonly order: OrderResponse
  readonly mode: SplitMode
  readonly remaining: number
  readonly itemIds: readonly number[]
}

/** Lo que se cobra en este pago según el modo elegido, sin la propina. */
export function chargeCents({ order, mode, remaining, itemIds }: ChargeRequest): number {
  if (mode === 'equal') {
    return equalPartCents(balanceCents(order), remaining)
  }
  if (mode === 'items') {
    return itemsCents(order, itemIds)
  }
  return balanceCents(order)
}
