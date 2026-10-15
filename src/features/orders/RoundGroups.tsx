import { type ReactNode, useId } from 'react'

import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { kitchenRounds } from './kitchenRounds'
import { NewRoundBadge } from './NewRoundBadge'

interface RoundGroupsProps {
  readonly order: OrderResponse
  /** Cómo se dibuja una lista de platos: la cocina sin precios, el detalle con ellos. */
  readonly renderItems: (items: readonly OrderItemResponse[]) => ReactNode
}

/**
 * Los platos de un pedido por ronda: arriba lo agregado en la última, con
 * «Nuevo», y debajo, plegado y atenuado, lo que ya se había enviado. Un pedido
 * que fue a cocina de una sola vez se ve como siempre.
 */
export function RoundGroups({ order, renderItems }: RoundGroupsProps) {
  const titleId = useId()
  const { added, sent } = kitchenRounds(order)
  if (added === null) {
    return <>{renderItems(sent)}</>
  }

  return (
    <div className="flex flex-col gap-3">
      <section aria-labelledby={titleId} className="flex flex-col gap-2 rounded-lg p-2 ring-2 ring-primary">
        <p id={titleId} className="m-0 flex flex-wrap items-center gap-2 text-sm font-bold">
          Agregado (ronda {added.round})
          <NewRoundBadge />
        </p>
        {renderItems(added.items)}
      </section>
      {sent.length === 0 ? null : (
        <details className="text-muted-foreground">
          <summary className="cursor-pointer rounded text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Ya enviados ({sent.length})
          </summary>
          <div className="pt-2">{renderItems(sent)}</div>
        </details>
      )}
    </div>
  )
}
