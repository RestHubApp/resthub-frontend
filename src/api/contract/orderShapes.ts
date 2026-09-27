import { boolean, eachLike, integer, isoDate, isoDatetime, like, money, nullValue, oneOf, string } from './pactHarness'

// Las formas que el frontend lee de un pedido y de una mesa. Se declaran por
// tipo y formato, no por valor: el contrato dice «un monto con dos decimales»,
// no «28.00».

export const ORDER_STATUSES = ['open', 'in_kitchen', 'ready', 'served', 'paid', 'cancelled'] as const
export const PAYMENT_METHODS = ['cash', 'card', 'yape', 'plin', 'transfer'] as const

export function orderItemShape(menuItemId = 1) {
  return {
    id: integer(10),
    menu_item_id: integer(menuItemId),
    name: string('Lomo saltado'),
    unit_price: money('28.00'),
    quantity: integer(2),
    notes: string(''),
    modifiers: [],
    subtotal: money('56.00'),
    is_courtesy: boolean(false),
    courtesy_reason: string(''),
    is_paid: boolean(false),
    created_at: isoDatetime(),
  }
}

export function paymentShape() {
  return {
    id: integer(1),
    method: oneOf(PAYMENT_METHODS, 'yape'),
    method_label: string('Yape'),
    amount: money('56.00'),
    tip: money('0.00'),
    received_by: integer(1),
    received_by_name: string('Encargado Demo'),
    item_ids: [],
    created_at: isoDatetime(),
  }
}

/** Un pedido como lo devuelven todas las rutas de `/orders`. */
export function orderShape(status: (typeof ORDER_STATUSES)[number], overrides: Record<string, unknown> = {}) {
  return like({
    id: integer(1),
    number: integer(1),
    business_date: isoDate(),
    type: oneOf(['dine_in', 'takeaway', 'delivery'], 'dine_in'),
    type_label: string('Mesa'),
    status: oneOf(ORDER_STATUSES, status),
    status_label: string('Abierto'),
    table_id: integer(1),
    table_label: string('1'),
    customer_name: string(''),
    waiter_id: integer(1),
    waiter_name: string('Encargado Demo'),
    notes: string(''),
    items: eachLike(orderItemShape()),
    item_count: integer(2),
    subtotal: money('56.00'),
    courtesy_amount: money('0.00'),
    discount_percent: money('0.00'),
    discount_amount: money('0.00'),
    total: money('56.00'),
    paid_amount: money('0.00'),
    balance: money('56.00'),
    tips: money('0.00'),
    payments: [],
    payment_method: nullValue(),
    created_at: isoDatetime(),
    updated_at: isoDatetime(),
    status_changed_at: isoDatetime(),
    paid_at: nullValue(),
    ...overrides,
  })
}
