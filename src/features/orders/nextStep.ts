import type { OrderStep } from '../../api/orders'
import type { OrderResponse, OrderStatus, PermissionCode } from '../../api/types'
import type { IconName } from '../../components/icons'

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
    waiting: 'En cocina. Esta pantalla avisa sola cuando esté listo.',
  },
  ready: {
    label: 'Marcar servido',
    icon: 'servir',
    action: 'served',
    permission: 'orders.take',
    waiting: 'Listo para servir.',
  },
  served: {
    label: 'Cobrar',
    icon: 'pago',
    action: 'charge',
    permission: 'orders.charge',
    waiting: 'Servido: lo cobra el encargado en caja.',
  },
}

export function nextStepFor(status: OrderStatus): NextStep | undefined {
  return STEPS[status]
}

// El aviso sale del estado en que quedo el pedido, no del boton que se toco.
const DONE: Partial<Record<OrderStatus, string>> = {
  in_kitchen: 'enviado a cocina',
  ready: 'listo para servir',
  served: 'servido',
}

export function stepDoneMessage(order: OrderResponse): string {
  return `Pedido #${String(order.number)} ${DONE[order.status] ?? 'actualizado'}.`
}
