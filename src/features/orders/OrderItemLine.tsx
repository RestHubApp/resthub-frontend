import type { ReactNode } from 'react'

import type { OrderItemResponse } from '@/api/types'
import type { OrderNoteFlag } from '@/hooks/useOrderNoteFlags'
import { ItemNote } from './ItemNote'
import { isVoided } from './kitchenRounds'
import { VoidedNote } from './VoidedNote'
import { formatMoney } from '@/services/format'

interface OrderItemLineProps {
  readonly item: OrderItemResponse
  /** La cocina no necesita precios; el mesero y la caja, si. */
  readonly showPrice?: boolean
  /** La lectura de su nota, para marcar una alergia. */
  readonly flag?: OrderNoteFlag | undefined
  /** Una acción sobre el plato, al final de su línea (anularlo). */
  readonly action?: ReactNode
}

/**
 * "2 × Lomo saltado", con su nota resaltada debajo. Un plato anulado se ve
 * tachado y con su motivo; no se prepara ni se cobra.
 */
export function OrderItemLine({ item, showPrice = false, flag, action }: OrderItemLineProps) {
  const isVoid = isVoided(item)
  return (
    <li className={`flex flex-col ${isVoid ? 'text-muted-foreground' : ''}`}>
      <div className="flex items-baseline gap-2">
        <span className="min-w-7 font-bold tabular-nums">{item.quantity}×</span>
        <span className={`min-w-0 flex-1 ${isVoid ? 'line-through' : ''}`}>{item.name}</span>
        {showPrice ? (
          <span className={`text-sm tabular-nums text-muted-foreground ${isVoid ? 'line-through' : ''}`}>{formatMoney(item.subtotal)}</span>
        ) : null}
        {action}
      </div>
      <div className="pl-9">
        {isVoid ? <VoidedNote item={item} /> : null}
        {item.modifiers.length > 0 ? (
          <p className="m-0 text-sm font-medium">{item.modifiers.map((modifier) => modifier.option).join(' · ')}</p>
        ) : null}
        <ItemNote note={item.notes} flag={flag} />
      </div>
    </li>
  )
}
