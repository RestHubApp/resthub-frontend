import { useQuery } from '@tanstack/react-query'
import { Suspense, useMemo, useState } from 'react'
import { PERMISSION } from '@/api/permissions'
import { lazyNamed } from '@/components/lazyNamed'
import { Link } from 'react-router'

import { activeOrdersQuery } from '@/api/orders'
import type { OrderResponse, OrderStatus } from '@/api/types'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useOrderNoteFlags } from '@/hooks/useOrderNoteFlags'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import { BoardColumn } from './board/BoardColumn'
import { BoardSkeleton } from './board/BoardSkeleton'
import { TypeFilter, type TypeFilterValue } from './board/TypeFilter'
import { LiveIndicator } from './LiveIndicator'
import { QueryError } from './QueryError'
import { useLiveUpdates } from './useLiveUpdates'
import { STATUS_LABELS } from './orderLabels'
import { useNow } from './useNow'

// Los diálogos traen react-hook-form y zod: se bajan al abrirlos, no con el tablero.
const CancelOrderDialog = lazyNamed(() => import('./CancelOrderDialog'), 'CancelOrderDialog')
const ChargeDialog = lazyNamed(() => import('./charge/ChargeDialog'), 'ChargeDialog')

const COLUMNS: readonly OrderStatus[] = ['open', 'in_kitchen', 'ready', 'served']

function count(orders: readonly OrderResponse[]): Record<TypeFilterValue, number> {
  const de = (type: OrderResponse['type']) => orders.filter((order) => order.type === type).length
  return { all: orders.length, dine_in: de('dine_in'), takeaway: de('takeaway'), delivery: de('delivery') }
}

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
  const active = useQuery(activeOrdersQuery)
  const [type, setType] = useState<TypeFilterValue>('all')
  const [charge, setCharge] = useState<OrderResponse | null>(null)
  const [cancel, setCancel] = useState<OrderResponse | null>(null)
  const orders = useMemo(() => active.data ?? [], [active.data])
  const ids = useMemo(() => orders.map((order) => order.id), [orders])
  // El tablero ya escucha el canal de avisos: el tema `insights` refresca las
  // notas desde useLiveUpdates y no hace falta una segunda conexión.
  const canViewAllergies = useCan(PERMISSION.insightsRead)
  const notes = useOrderNoteFlags(ids, { enabled: canViewAllergies, live: false })
  const visible = type === 'all' ? orders : orders.filter((order) => order.type === type)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tablero"
        description="Los pedidos en curso, del más antiguo al más nuevo."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <LiveIndicator status={live} />
            <Button asChild variant="outline" size="lg" className="h-11 px-4">
              <Link to={paths.board.history}>
                <Icon name="historial" size={18} />
                <span>Historial</span>
              </Link>
            </Button>
          </div>
        }
      />
      <TypeFilter value={type} counts={count(orders)} onChange={setType} />
      {active.isPending ? <BoardSkeleton titles={COLUMNS.map((column) => STATUS_LABELS[column])} /> : null}
      {active.isError ? (
        <QueryError error={active.error} fallback="No se pudieron cargar los pedidos." onRetry={() => void active.refetch()} />
      ) : null}
      {active.isSuccess ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column}
              title={STATUS_LABELS[column]}
              orders={visible.filter((order) => order.status === column)}
              now={now}
              flagFor={notes.flagFor}
              onCharge={setCharge}
              onCancel={setCancel}
            />
          ))}
        </div>
      ) : null}
      <Suspense fallback={null}>
        {charge === null ? null : <ChargeDialog order={charge} onClose={() => {
          setCharge(null)
        }} />}
        {cancel === null ? null : <CancelOrderDialog order={cancel} onClose={() => {
          setCancel(null)
        }} />}
      </Suspense>
    </div>
  )
}
