import type { OrderResponse } from '@/api/types'
import { TablePickerDialog } from './TablePickerDialog'
import type { TableMoves } from './useTableMoves'

interface TableMoveDialogsProps {
  readonly order: OrderResponse
  readonly moves: TableMoves
}

/** Los dos selectores de mesa: a cuál mover el pedido y cuál unirle. */
export function TableMoveDialogs({ order, moves }: TableMoveDialogsProps) {
  const { dialog, close, move, join, canViewAll, isMine } = moves

  return (
    <>
      <TablePickerDialog
        open={dialog === 'mover'}
        title="Cambiar de mesa"
        description="Los platos, las notas y la cuenta pasan a la mesa que elijas."
        filter={(table) => table.status === 'free'}
        empty="No hay mesas libres"
        pending={move.isPending}
        onPick={(table) => {
          move.mutate(table)
        }}
        onClose={close}
      />
      <TablePickerDialog
        open={dialog === 'unir'}
        title="Unir otra mesa a esta"
        description="Sus platos pasan a este pedido y esa mesa queda libre."
        filter={(table) =>
          table.active_order !== null && table.active_order.id !== order.id && isMine(table.active_order.waiter_id)
        }
        empty={canViewAll ? 'No hay otras mesas con pedido' : 'No tienes otras mesas con pedido'}
        pending={join.isPending}
        onPick={(table) => {
          join.mutate(table)
        }}
        onClose={close}
      />
    </>
  )
}
