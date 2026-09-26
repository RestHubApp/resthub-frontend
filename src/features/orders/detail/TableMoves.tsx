import { useState } from 'react'

import { mergeOrders, moveOrder } from '../../../api/orders'
import { tableName } from '../../../api/tables'
import type { OrderResponse, TableState } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { useCan, useSession } from '../../../store/session'
import { useOrderAction } from '../useOrderAction'
import TablePickerDialog from './TablePickerDialog'

interface TableMovesProps {
  readonly order: OrderResponse
}

type Dialogo = 'mover' | 'unir' | null

const BOTON = 'h-11 px-4'

/**
 * Cambiar de mesa y unir mesas, para un pedido en mesa que sigue en curso.
 *
 * Unir va antes del primer pago: con una parte cobrada, lo que pagó cada uno
 * dejaría de cuadrar. Y el mesero solo une mesas suyas: los platos que se unen
 * pasan a cobrarse con este pedido. El servidor exige las dos cosas igual.
 */
export default function TableMoves({ order }: TableMovesProps) {
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const veTodos = useCan('orders.read_all')
  const yo = useSession((state) => state.account?.user.id)
  const esMia = (waiterId: number) => veTodos || waiterId === yo
  const cerrar = () => {
    setDialogo(null)
  }
  const mover = useOrderAction({
    mutationFn: (table: TableState) => moveOrder(order.id, table.id),
    success: (movido) => `Pedido #${String(movido.number)} ahora en ${tableName(movido.table_label ?? '')}.`,
    failure: 'No se pudo cambiar de mesa.',
    onSuccess: cerrar,
  })
  const unir = useOrderAction({
    mutationFn: (table: TableState) => mergeOrders(order.id, table.active_order?.id ?? 0),
    success: (unido) => `Mesas unidas en el pedido #${String(unido.number)}.`,
    failure: 'No se pudieron unir las mesas.',
    onSuccess: cerrar,
  })

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className={BOTON} onClick={() => {
        setDialogo('mover')
      }}>
        <Icon name="movimientos" size={16} />
        <span>Cambiar de mesa</span>
      </Button>
      {order.payments.length === 0 && esMia(order.waiter_id) ? (
        <Button type="button" variant="outline" className={BOTON} onClick={() => {
          setDialogo('unir')
        }}>
          <Icon name="mesa" size={16} />
          <span>Unir otra mesa</span>
        </Button>
      ) : null}
      <TablePickerDialog
        open={dialogo === 'mover'}
        title="Cambiar de mesa"
        description="Los platos, las notas y la cuenta pasan a la mesa que elijas."
        filter={(mesa) => mesa.status === 'free'}
        empty="No hay mesas libres"
        pending={mover.isPending}
        onPick={(mesa) => {
          mover.mutate(mesa)
        }}
        onClose={cerrar}
      />
      <TablePickerDialog
        open={dialogo === 'unir'}
        title="Unir otra mesa a esta"
        description="Sus platos pasan a este pedido y esa mesa queda libre."
        filter={(mesa) =>
          mesa.active_order !== null && mesa.active_order.id !== order.id && esMia(mesa.active_order.waiter_id)
        }
        empty={veTodos ? 'No hay otras mesas con pedido' : 'No tienes otras mesas con pedido'}
        pending={unir.isPending}
        onPick={(mesa) => {
          unir.mutate(mesa)
        }}
        onClose={cerrar}
      />
    </div>
  )
}
