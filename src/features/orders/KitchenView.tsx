import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { activeOrdersQuery } from '../../api/orders'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import { useOrderNoteFlags } from '../../hooks/useOrderNoteFlags'
import { useCan } from '../../store/session'
import BoardSkeleton from './board/BoardSkeleton'
import KitchenCard from './kitchen/KitchenCard'
import LiveIndicator from './LiveIndicator'
import QueryError from './QueryError'
import { useLiveUpdates } from './useLiveUpdates'
import { useNow } from './useNow'

// En cocina el tiempo corre rápido: se refresca cada quince segundos.
const REFRESCO_MS = 15_000

/**
 * La pantalla de cocina: solo lo que falta preparar y lo que espera a salir.
 *
 * Pensada para una tablet o una pantalla en la cocina: tarjetas grandes, del
 * pedido más antiguo al más nuevo, sin precios ni cobro. Se actualiza sola.
 */
export default function KitchenView() {
  const live = useLiveUpdates()
  const now = useNow(REFRESCO_MS)
  const activos = useQuery(activeOrdersQuery)
  const pedidos = useMemo(() => activos.data ?? [], [activos.data])
  const enCocina = pedidos.filter((order) => order.status === 'in_kitchen')
  const listos = pedidos.filter((order) => order.status === 'ready')
  const ids = useMemo(() => pedidos.map((order) => order.id), [pedidos])
  // Las alergias las ve quien tiene el panel; el resto ve las notas tal cual.
  const veAlergias = useCan('insights.read')
  const notas = useOrderNoteFlags(ids, { enabled: veAlergias, live: false })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Cocina"
        description="Lo que falta preparar, del pedido más antiguo al más nuevo."
        actions={<LiveIndicator status={live} />}
      />
      {activos.isPending ? <BoardSkeleton titles={['Por preparar', 'Listos para servir']} /> : null}
      {activos.isError ? (
        <QueryError error={activos.error} fallback="No se pudieron cargar los pedidos." onRetry={() => void activos.refetch()} />
      ) : null}
      <SectionCard title={`Por preparar (${String(enCocina.length)})`}>
        {activos.isSuccess && enCocina.length === 0 ? <EmptyState title="Nada pendiente en cocina" /> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {enCocina.map((order) => (
            <KitchenCard key={order.id} order={order} now={now} flagFor={notas.flagFor} />
          ))}
        </div>
      </SectionCard>
      <SectionCard title={`Listos para servir (${String(listos.length)})`} collapsible>
        {activos.isSuccess && listos.length === 0 ? <EmptyState title="Nada esperando a salir" /> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listos.map((order) => (
            <KitchenCard key={order.id} order={order} now={now} flagFor={notas.flagFor} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
