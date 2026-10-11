import type { NewItemRequest, OpenOrderRequest } from '@/api/types'
import { paths } from '@/services/paths'

/** A dónde y a quién se entrega un delivery. */
interface DeliveryInfo {
  readonly phone: string
  readonly address: string
  readonly reference: string
}

/** A dónde va lo que se está marcando: una mesa, para llevar o delivery, o un pedido existente. */
export type OrderTarget =
  | { readonly kind: 'table'; readonly tableId: number }
  | {
      readonly kind: 'takeaway'
      readonly customerName: string
      /** Con datos de entrega es un delivery; sin ellos, para llevar. */
      readonly delivery?: DeliveryInfo
      /** El cliente de la libreta, si se eligió de ahí. */
      readonly customerId?: number
    }
  | { readonly kind: 'add'; readonly orderId: number }

/** La clave del borrador: cada mesa y cada pedido tiene el suyo. */
export function draftKey(target: OrderTarget): string {
  switch (target.kind) {
    case 'table':
      return `mesa-${String(target.tableId)}`
    case 'takeaway':
      return target.delivery === undefined ? 'llevar' : 'delivery'
    case 'add':
      return `pedido-${String(target.orderId)}`
  }
}

/** A donde vuelve "Atras". */
export function backPath(target: OrderTarget): string {
  if (target.kind === 'add') {
    return paths.orders.detail(target.orderId)
  }
  return target.kind === 'takeaway' ? paths.orders.takeaway : paths.orders.list
}

/** Los datos de entrega del cuerpo del pedido; vacios si no es delivery. */
function deliveryFields(delivery: DeliveryInfo | undefined) {
  if (delivery === undefined) {
    return { customer_phone: '', delivery_address: '', delivery_reference: '' }
  }
  return { customer_phone: delivery.phone, delivery_address: delivery.address, delivery_reference: delivery.reference }
}

/**
 * El cuerpo para abrir el pedido.
 *
 * `clientRequestId` lo genera el celular: si el pedido se reintenta (volvió la
 * señal, doble toque) con el mismo valor, el servidor devuelve el que ya abrió.
 */
export function openRequest(
  target: Exclude<OrderTarget, { kind: 'add' }>,
  items: NewItemRequest[],
  clientRequestId: string,
): OpenOrderRequest {
  const base = {
    notes: '',
    items,
    client_request_id: clientRequestId,
    customer_phone: '',
    delivery_address: '',
    delivery_reference: '',
  }
  if (target.kind === 'table') {
    return { ...base, type: 'dine_in', table_id: target.tableId, customer_name: '' }
  }
  return {
    ...base,
    type: target.delivery === undefined ? 'takeaway' : 'delivery',
    customer_name: target.customerName,
    customer_id: target.customerId ?? null,
    ...deliveryFields(target.delivery),
  }
}
