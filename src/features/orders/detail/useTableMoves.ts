import { useState } from 'react'

import { mergeOrders, moveOrder } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import { tableName } from '@/api/tables'
import type { OrderResponse, TableState } from '@/api/types'
import { staffOf, useCan, useSession } from '@/store/session'
import { useOrderAction } from '@/features/orders/useOrderAction'

export type TableMoveDialog = 'mover' | 'unir' | null

/**
 * Las acciones de mover y unir mesas de un pedido, con el diálogo abierto.
 *
 * `isMine` dice si el mesero puede unir esa mesa: el encargado puede con todas.
 */
export function useTableMoves(order: OrderResponse) {
  const [dialog, setDialog] = useState<TableMoveDialog>(null)
  const canViewAll = useCan(PERMISSION.ordersReadAll)
  const me = useSession((state) => staffOf(state.account)?.user.id)
  const close = () => {
    setDialog(null)
  }
  const move = useOrderAction({
    mutationFn: (table: TableState) => moveOrder(order.id, table.id),
    success: (moved) => `Pedido #${String(moved.number)} ahora en ${tableName(moved.table_label ?? '')}.`,
    failure: 'No se pudo cambiar de mesa.',
    onSuccess: close,
  })
  const join = useOrderAction({
    mutationFn: (table: TableState) => mergeOrders(order.id, table.active_order?.id ?? 0),
    success: (joined) => `Mesas unidas en el pedido #${String(joined.number)}.`,
    failure: 'No se pudieron unir las mesas.',
    onSuccess: close,
  })

  return {
    dialog,
    setDialog,
    close,
    move,
    join,
    canViewAll,
    isMine: (waiterId: number) => canViewAll || waiterId === me,
  }
}

/** Lo que devuelve `useTableMoves`. */
export type TableMoves = ReturnType<typeof useTableMoves>
