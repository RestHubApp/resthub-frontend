import type { OrderStep } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse, OrderStatus, PermissionCode } from '@/api/types'
import type { IconGlyph } from '@/components/Icon'
import * as icons from '@/components/icons'
import { STATUS_LABELS } from './orderLabels'

/** Lo siguiente que se hace con un pedido en cada estado, y quien puede hacerlo. */
export interface NextStep {
  readonly label: string
  readonly icon: IconGlyph
  /** Una transicion sin cuerpo, o `charge` para abrir el cobro. */
  readonly action: OrderStep | 'charge'
  readonly permission: PermissionCode
  /** Lo que se lee cuando la cuenta no puede dar el paso. */
  readonly waiting: string
}

const STEPS: Partial<Record<OrderStatus, NextStep>> = {
  open: {
    label: 'Enviar a cocina',
    icon: icons.send,
    action: 'send',
    permission: PERMISSION.ordersTake,
    waiting: 'Abierto: falta enviarlo a cocina.',
  },
  in_kitchen: {
    label: 'Marcar listo',
    icon: icons.ready,
    action: 'ready',
    permission: PERMISSION.ordersManage,
    waiting: 'En cocina: esta pantalla avisa sola cuando esté listo.',
  },
  ready: {
    label: 'Marcar servido',
    icon: icons.serve,
    action: 'served',
    permission: PERMISSION.ordersTake,
    waiting: 'Listo: falta servirlo.',
  },
  served: {
    label: 'Cobrar',
    icon: icons.payment,
    action: 'charge',
    permission: PERMISSION.ordersCharge,
    waiting: 'Servido, por cobrar: lo cobra quien lo atendió o el encargado.',
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
