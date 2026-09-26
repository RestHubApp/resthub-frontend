import type { NewItemRequest, OpenOrderRequest } from '../../../api/types'

/** A dónde y a quién se entrega un delivery. */
export interface DeliveryInfo {
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
    return `/pedidos/${String(target.orderId)}`
  }
  return target.kind === 'takeaway' ? '/pedidos?vista=llevar' : '/pedidos'
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
  const delivery = target.delivery
  return {
    ...base,
    type: delivery === undefined ? 'takeaway' : 'delivery',
    customer_name: target.customerName,
    customer_id: target.customerId ?? null,
    customer_phone: delivery?.phone ?? '',
    delivery_address: delivery?.address ?? '',
    delivery_reference: delivery?.reference ?? '',
  }
}
