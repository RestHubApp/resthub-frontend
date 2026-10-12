import { useNavigate } from 'react-router'

import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { ActionsMenu, type ActionsMenuItem } from '@/components/ActionsMenu'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import { isActive } from '@/features/orders/orderLabels'
import { TableMoveDialogs } from './TableMoveDialogs'
import { type TableMoves, useTableMoves } from './useTableMoves'

interface OrderMoreActionsProps {
  readonly order: OrderResponse
  readonly onCancel: () => void
}

interface EntriesOptions {
  readonly order: OrderResponse
  readonly moves: TableMoves
  readonly canCancel: boolean
  readonly onCancel: () => void
  readonly goTo: (path: string) => void
}

// Cambiar de mesa y unir mesas: solo un pedido en mesa que sigue en curso.
// Unir va antes del primer pago (con una parte cobrada, lo que pagó cada uno
// dejaría de cuadrar) y el mesero solo une mesas suyas; el servidor exige las
// dos cosas igual.
function tableEntries({ order, moves }: EntriesOptions): ActionsMenuItem[] {
  if (order.type !== 'dine_in' || !isActive(order.status)) {
    return []
  }
  const entries: ActionsMenuItem[] = [
    { label: 'Cambiar de mesa', icon: 'movements', onSelect: () => { moves.setDialog('mover') } },
  ]
  if (order.payments.length === 0 && moves.isMine(order.waiter_id)) {
    entries.push({ label: 'Unir otra mesa', icon: 'table', onSelect: () => { moves.setDialog('unir') } })
  }
  return entries
}

// La comanda tiene sentido desde que el pedido va a cocina; la cuenta, en
// cualquier momento (antes de pagar es la precuenta, después el ticket).
function printEntries({ order, goTo }: EntriesOptions): ActionsMenuItem[] {
  const entries: ActionsMenuItem[] = []
  if (order.status !== 'open' && order.status !== 'cancelled') {
    entries.push({ label: 'Imprimir comanda', icon: 'print', onSelect: () => { goTo(paths.orders.print(order.id, 'comanda')) } })
  }
  if (order.status !== 'cancelled') {
    entries.push({
      label: order.status === 'paid' ? 'Imprimir ticket' : 'Imprimir precuenta',
      icon: 'print',
      onSelect: () => { goTo(paths.orders.print(order.id, 'cuenta')) },
    })
  }
  return entries
}

function entriesOf(options: EntriesOptions): ActionsMenuItem[] {
  const cancel: ActionsMenuItem[] =
    options.canCancel && isActive(options.order.status)
      ? [{ label: 'Cancelar pedido', icon: 'cancel', isDestructive: true, onSelect: options.onCancel }]
      : []
  return [...tableEntries(options), ...printEntries(options), ...cancel]
}

/**
 * «Más acciones» de un pedido: cambiar de mesa, unir mesas, imprimir la
 * comanda o la cuenta y, al final y en rojo, cancelar el pedido.
 *
 * Deja a la vista una sola acción principal y «Agregar platos»; lo demás se
 * usa de vez en cuando y no necesita el mismo peso.
 */
export function OrderMoreActions({ order, onCancel }: OrderMoreActionsProps) {
  const moves = useTableMoves(order)
  const canCancel = useCan(PERMISSION.ordersManage)
  const navigate = useNavigate()
  const items = entriesOf({
    order,
    moves,
    canCancel,
    onCancel,
    goTo: (path) => {
      void navigate(path)
    },
  })

  if (items.length === 0) {
    return null
  }
  return (
    <>
      <ActionsMenu label="Más acciones del pedido" text="Más acciones" items={items} />
      <TableMoveDialogs order={order} moves={moves} />
    </>
  )
}
