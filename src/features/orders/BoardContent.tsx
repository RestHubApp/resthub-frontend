import type { UseQueryResult } from '@tanstack/react-query'

import type { OrderResponse } from '@/api/types'
import type { OrderNoteFlags } from '@/hooks/useOrderNoteFlags'
import { BoardColumn } from './board/BoardColumn'
import { BoardSkeleton } from './board/BoardSkeleton'
import { COLUMNS } from './boardColumns'
import { STATUS_LABELS } from './orderLabels'
import { RetryQueryError } from '@/components/RetryQueryError'

interface BoardContentProps {
  /** La consulta de los pedidos en curso: decide si se ve la silueta, el error o las columnas. */
  readonly active: UseQueryResult<OrderResponse[]>
  /** Los pedidos que pasan el filtro por tipo. */
  readonly visible: readonly OrderResponse[]
  readonly now: number
  readonly flagFor: OrderNoteFlags['flagFor']
  readonly onCharge: (order: OrderResponse) => void
  readonly onCancel: (order: OrderResponse) => void
}

/** El cuerpo del tablero: silueta al cargar, error con reintento o una columna por estado. */
export function BoardContent({ active, visible, now, flagFor, onCharge, onCancel }: BoardContentProps) {
  return (
    <>
      {active.isPending ? <BoardSkeleton titles={COLUMNS.map((column) => STATUS_LABELS[column])} /> : null}
      {active.isError ? (
        <RetryQueryError error={active.error} fallback="No se pudieron cargar los pedidos." onRetry={() => void active.refetch()} />
      ) : null}
      {active.isSuccess ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column}
              title={STATUS_LABELS[column]}
              orders={visible.filter((order) => order.status === column)}
              now={now}
              flagFor={flagFor}
              onCharge={onCharge}
              onCancel={onCancel}
            />
          ))}
        </div>
      ) : null}
    </>
  )
}
