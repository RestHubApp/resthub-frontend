import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { activeOrdersQuery } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { useOrderNoteFlags } from '@/hooks/useOrderNoteFlags'
import { useCan } from '@/store/session'
import { BoardSkeleton } from './board/BoardSkeleton'
import { KitchenCard } from './kitchen/KitchenCard'
import { LiveIndicator } from './LiveIndicator'
import { QueryError } from './QueryError'
import { useLiveUpdates } from './useLiveUpdates'
import { useNow } from './useNow'

// En cocina el tiempo corre rápido: se refresca cada quince segundos.
const REFRESH_MS = 15_000

/**
 * La pantalla de cocina: solo lo que falta preparar y lo que espera a salir.
 *
 * Pensada para una tablet o una pantalla en la cocina: tarjetas grandes, del
 * pedido más antiguo al más nuevo, sin precios ni cobro. Se actualiza sola.
 */
export function KitchenView() {
  const live = useLiveUpdates()
  const now = useNow(REFRESH_MS)
  const active = useQuery(activeOrdersQuery)
  const orders = useMemo(() => active.data ?? [], [active.data])
  const inKitchen = orders.filter((order) => order.status === 'in_kitchen')
  const ready = orders.filter((order) => order.status === 'ready')
  const ids = useMemo(() => orders.map((order) => order.id), [orders])
  // Las alergias las ve quien tiene el panel; el resto ve las notas tal cual.
  const canViewAllergies = useCan(PERMISSION.insightsRead)
  const notes = useOrderNoteFlags(ids, { enabled: canViewAllergies, live: false })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Cocina"
        description="Lo que falta preparar, del pedido más antiguo al más nuevo."
        actions={<LiveIndicator status={live} />}
      />
      {active.isPending ? <BoardSkeleton titles={['Por preparar', 'Listos para servir']} /> : null}
      {active.isError ? (
        <QueryError error={active.error} fallback="No se pudieron cargar los pedidos." onRetry={() => void active.refetch()} />
      ) : null}
      {/* Mientras carga, la silueta ocupa el lugar de las dos secciones; antes se
          veían las dos a la vez y, al irse la silueta, las secciones saltaban
          (CLS de 0,58 en el celular). */}
      {active.isPending ? null : (
        <>
          <SectionCard title={`Por preparar (${String(inKitchen.length)})`}>
            {active.isSuccess && inKitchen.length === 0 ? <EmptyState title="Nada pendiente en cocina" /> : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {inKitchen.map((order) => (
                <KitchenCard key={order.id} order={order} now={now} flagFor={notes.flagFor} />
              ))}
            </div>
          </SectionCard>
          <SectionCard title={`Listos para servir (${String(ready.length)})`} collapsible>
            {active.isSuccess && ready.length === 0 ? <EmptyState title="Nada esperando a salir" /> : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ready.map((order) => (
                <KitchenCard key={order.id} order={order} now={now} flagFor={notes.flagFor} />
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
