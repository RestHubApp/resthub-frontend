import { useState } from 'react'

import { mergeOrders, moveOrder } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import { tableName } from '@/api/tables'
import type { OrderResponse, TableState } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useCan, useSession } from '@/store/session'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { TablePickerDialog } from './TablePickerDialog'

interface TableMovesProps {
  readonly order: OrderResponse
}

type Dialog = 'mover' | 'unir' | null

const BUTTON = 'h-11 px-4'

/**
 * Cambiar de mesa y unir mesas, para un pedido en mesa que sigue en curso.
 *
 * Unir va antes del primer pago: con una parte cobrada, lo que pagó cada uno
 * dejaría de cuadrar. Y el mesero solo une mesas suyas: los platos que se unen
 * pasan a cobrarse con este pedido. El servidor exige las dos cosas igual.
 */
export function TableMoves({ order }: TableMovesProps) {
  const [dialog, setDialog] = useState<Dialog>(null)
  const canViewAll = useCan(PERMISSION.ordersReadAll)
  const me = useSession((state) => state.account?.user.id)
  const esMia = (waiterId: number) => canViewAll || waiterId === me
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

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className={BUTTON} onClick={() => {
        setDialog('mover')
      }}>
        <Icon name="movimientos" size={16} />
        <span>Cambiar de mesa</span>
      </Button>
      {order.payments.length === 0 && esMia(order.waiter_id) ? (
        <Button type="button" variant="outline" className={BUTTON} onClick={() => {
          setDialog('unir')
        }}>
          <Icon name="mesa" size={16} />
          <span>Unir otra mesa</span>
        </Button>
      ) : null}
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
          table.active_order !== null && table.active_order.id !== order.id && esMia(table.active_order.waiter_id)
        }
        empty={canViewAll ? 'No hay otras mesas con pedido' : 'No tienes otras mesas con pedido'}
        pending={join.isPending}
        onPick={(table) => {
          join.mutate(table)
        }}
        onClose={close}
      />
    </div>
  )
}
