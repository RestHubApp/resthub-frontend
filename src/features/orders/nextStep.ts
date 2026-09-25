import type { OrderStep } from '../../api/orders'
import type { OrderResponse, OrderStatus, PermissionCode } from '../../api/types'
import type { IconName } from '../../components/icons'
import { STATUS_LABELS } from './orderLabels'

/** Lo siguiente que se hace con un pedido en cada estado, y quien puede hacerlo. */
export interface NextStep {
  readonly label: string
  readonly icon: IconName
  /** Una transicion sin cuerpo, o `charge` para abrir el cobro. */
  readonly action: OrderStep | 'charge'
  readonly permission: PermissionCode
  /** Lo que se lee cuando la cuenta no puede dar el paso. */
  readonly waiting: string
}

const STEPS: Partial<Record<OrderStatus, NextStep>> = {
  open: {
    label: 'Enviar a cocina',
    icon: 'enviar',
    action: 'send',
    permission: 'orders.take',
    waiting: 'Abierto: falta enviarlo a cocina.',
  },
  in_kitchen: {
    label: 'Marcar listo',
    icon: 'listo',
    action: 'ready',
    permission: 'orders.manage',
    waiting: 'En cocina: esta pantalla avisa sola cuando esté listo.',
  },
  ready: {
    label: 'Marcar servido',
    icon: 'servir',
    action: 'served',
    permission: 'orders.take',
    waiting: 'Listo: falta servirlo.',
  },
  served: {
    label: 'Cobrar',
    icon: 'pago',
    action: 'charge',
    permission: 'orders.charge',
    waiting: 'Servido, por cobrar: lo cobra el encargado en caja.',
  },
}

export function nextStepFor(status: OrderStatus): NextStep | undefined {
  return STEPS[status]
}

// El aviso sale del estado en que quedo el pedido, no del boton que se toco.
// El aviso sale del estado en que quedo el pedido, no del boton que se toco, y
// usa el mismo nombre del estado que la insignia y la columna del tablero.
const DONE: Partial<Record<OrderStatus, string>> = {
  in_kitchen: 'enviado a cocina',
  ready: STATUS_LABELS.ready.toLowerCase(),
  served: STATUS_LABELS.served.toLowerCase(),
}

/** "Pedido #12 enviado a cocina.", "Pedido #12 listo.", "Pedido #12 servido, por cobrar." */
export function stepDoneMessage(order: OrderResponse): string {
  return `Pedido #${String(order.number)} ${DONE[order.status] ?? 'actualizado'}.`
}
