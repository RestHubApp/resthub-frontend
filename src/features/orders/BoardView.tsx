import { useState } from 'react'

import type { OrderResponse } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { TypeFilter, type TypeFilterValue } from './board/TypeFilter'
import { BoardContent } from './BoardContent'
import { BoardHeaderActions } from './BoardHeaderActions'
import { countByType } from './boardColumns'
import { OrderDialogs } from './OrderDialogs'
import { useActiveOrders } from './useActiveOrders'
import { useLiveUpdates } from './useLiveUpdates'
import { useNow } from './useNow'

/**
 * El tablero del encargado: los pedidos del dia en vivo, de la cocina a la caja.
 *
 * Una columna por estado. Los pedidos llegan y se mueven solos con los avisos
 * del servidor. Las ventanas de cobro y cancelacion viven aca y no en cada
 * tarjeta: al cobrar, la tarjeta sale del tablero y el vuelto sigue a la vista.
 */
export function BoardView() {
  const live = useLiveUpdates()
  const now = useNow()
  const { active, orders, flagFor } = useActiveOrders()
  const [type, setType] = useState<TypeFilterValue>('all')
  const [charge, setCharge] = useState<OrderResponse | null>(null)
  const [cancel, setCancel] = useState<OrderResponse | null>(null)
  const visible = type === 'all' ? orders : orders.filter((order) => order.type === type)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tablero"
        description="Los pedidos en curso, del más antiguo al más nuevo."
        actions={<BoardHeaderActions live={live} />}
      />
      <TypeFilter value={type} counts={countByType(orders)} onChange={setType} />
      <BoardContent active={active} visible={visible} now={now} flagFor={flagFor} onCharge={setCharge} onCancel={setCancel} />
      <OrderDialogs
        chargeOrder={charge}
        cancelOrder={cancel}
        onCloseCharge={() => {
          setCharge(null)
        }}
        onCloseCancel={() => {
          setCancel(null)
        }}
      />
    </div>
  )
}
