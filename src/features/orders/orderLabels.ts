import type { OrderResponse, OrderStatus, OrderType, PaymentMethod } from '../../api/types'
import { tableName } from '../../api/tables'
import type { StatusTone } from '../../components/StatusBadge'

// El nombre de cada estado es uno solo en toda la aplicacion: la insignia, la
// columna del tablero, el filtro del historial y los avisos dicen lo mismo.
// "Servido, por cobrar" y no solo "Servido" porque es lo que falta hacer. Los
// medios de pago usan el texto del servidor (`payment_method_label`).

export const STATUS_LABELS: Record<OrderStatus, string> = {
  open: 'Abierto',
  in_kitchen: 'En cocina',
  ready: 'Listo',
  served: 'Servido, por cobrar',
  paid: 'Pagado',
  cancelled: 'Cancelado',
}

/** El tono de cada estado. El texto siempre acompana: el color no es la unica senal. */
export const STATUS_TONE: Record<OrderStatus, StatusTone | undefined> = {
  open: undefined,
  in_kitchen: 'pending',
  ready: 'completed',
  served: 'confirmed',
  paid: 'completed',
  cancelled: 'cancelled',
}

const STATUS_ORDER: readonly OrderStatus[] = ['open', 'in_kitchen', 'ready', 'served', 'paid', 'cancelled']

export const STATUS_OPTIONS: readonly { value: OrderStatus; label: string }[] = STATUS_ORDER.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

export const TYPE_OPTIONS: readonly { value: OrderType; label: string }[] = [
  { value: 'dine_in', label: 'En mesa' },
  { value: 'takeaway', label: 'Para llevar' },
  { value: 'delivery', label: 'Delivery' },
]

export const PAYMENT_METHODS: readonly { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
]

/** "Mesa 3", "Para llevar · Ana" o "Delivery · Ana". */
export function orderPlace(order: Pick<OrderResponse, 'type' | 'table_label' | 'customer_name'>): string {
  if (order.type === 'dine_in') {
    return order.table_label === null ? 'Mesa' : tableName(order.table_label)
  }
  const tipo = order.type === 'delivery' ? 'Delivery' : 'Para llevar'
  return order.customer_name === '' ? tipo : `${tipo} · ${order.customer_name}`
}

/** Teléfono, dirección y referencia de un delivery, sin los vacíos. Nada si no es delivery. */
export function deliveryLines(
  order: Pick<OrderResponse, 'type' | 'customer_phone' | 'delivery_address' | 'delivery_reference'>,
): string[] {
  if (order.type !== 'delivery') {
    return []
  }
  return [
    order.delivery_address,
    order.delivery_reference === '' ? '' : `Ref.: ${order.delivery_reference}`,
    order.customer_phone === '' ? '' : `Tel.: ${order.customer_phone}`,
  ].filter((line) => line !== '')
}

/** Un pedido que todavia ocupa mesa o espera cobro. */
export function isActive(status: OrderStatus): boolean {
  return status !== 'paid' && status !== 'cancelled'
}

/** "platos" o "plato", segun la cantidad. */
export function dishCount(count: number): string {
  return `${String(count)} ${count === 1 ? 'plato' : 'platos'}`
}
