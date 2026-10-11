import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { TableMoveDialogs } from './TableMoveDialogs'
import { useTableMoves } from './useTableMoves'

interface TableMovesProps {
  readonly order: OrderResponse
}

const BUTTON = 'h-11 px-4'

/**
 * Cambiar de mesa y unir mesas, para un pedido en mesa que sigue en curso.
 *
 * Unir va antes del primer pago: con una parte cobrada, lo que pagó cada uno
 * dejaría de cuadrar. Y el mesero solo une mesas suyas: los platos que se unen
 * pasan a cobrarse con este pedido. El servidor exige las dos cosas igual.
 */
export function TableMoves({ order }: TableMovesProps) {
  const moves = useTableMoves(order)
  const { setDialog, isMine } = moves

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className={BUTTON}
        onClick={() => {
          setDialog('mover')
        }}
      >
        <Icon name="movements" size={16} />
        <span>Cambiar de mesa</span>
      </Button>
      {order.payments.length === 0 && isMine(order.waiter_id) ? (
        <Button
          type="button"
          variant="outline"
          className={BUTTON}
          onClick={() => {
            setDialog('unir')
          }}
        >
          <Icon name="table" size={16} />
          <span>Unir otra mesa</span>
        </Button>
      ) : null}
      <TableMoveDialogs order={order} moves={moves} />
    </div>
  )
}
