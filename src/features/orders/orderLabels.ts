import type { OrderResponse, OrderStatus, OrderType, PaymentMethod } from '../../api/types'
import { tableName } from '../../api/tables'
import type { StatusTone } from '../../components/StatusBadge'

// El texto de estados y medios de pago lo manda el servidor (`*_label`). Estas
// tablas solo dicen como se ven y en que orden van.

/** El tono de cada estado. El texto siempre acompana: el color no es la unica senal. */
export const STATUS_TONE: Record<OrderStatus, StatusTone | undefined> = {
  open: undefined,
  in_kitchen: 'pending',
  ready: 'completed',
  served: 'confirmed',
  paid: 'completed',
  cancelled: 'cancelled',
}

export const STATUS_OPTIONS: readonly { value: OrderStatus; label: string }[] = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_kitchen', label: 'En cocina' },
  { value: 'ready', label: 'Listo' },
  { value: 'served', label: 'Servido' },
  { value: 'paid', label: 'Pagado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export const TYPE_OPTIONS: readonly { value: OrderType; label: string }[] = [
  { value: 'dine_in', label: 'En mesa' },
  { value: 'takeaway', label: 'Para llevar' },
]

export const PAYMENT_METHODS: readonly { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
]

/** "Mesa 3" o "Para llevar · Ana". */
export function orderPlace(order: Pick<OrderResponse, 'type' | 'table_label' | 'customer_name'>): string {
  if (order.type === 'dine_in') {
    return order.table_label === null ? 'Mesa' : tableName(order.table_label)
  }
  return order.customer_name === '' ? 'Para llevar' : `Para llevar · ${order.customer_name}`
}

/** Un pedido que todavia ocupa mesa o espera cobro. */
export function isActive(status: OrderStatus): boolean {
  return status !== 'paid' && status !== 'cancelled'
}

/** "platos" o "plato", segun la cantidad. */
export function dishCount(count: number): string {
  return `${String(count)} ${count === 1 ? 'plato' : 'platos'}`
}
