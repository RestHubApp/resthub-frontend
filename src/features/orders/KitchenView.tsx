import { PageHeader } from '@/components/PageHeader'
import { BoardSkeleton } from './board/BoardSkeleton'
import { KitchenSection } from './kitchen/KitchenSection'
import { LiveIndicator } from './LiveIndicator'
import { RetryQueryError } from '@/components/RetryQueryError'
import { useActiveOrders } from './useActiveOrders'
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
  const { active, orders, flagFor } = useActiveOrders()
  const inKitchen = orders.filter((order) => order.status === 'in_kitchen')
  const ready = orders.filter((order) => order.status === 'ready')

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Cocina"
        description="Lo que falta preparar, del pedido más antiguo al más nuevo."
        actions={<LiveIndicator status={live} />}
      />
      {active.isPending ? <BoardSkeleton titles={['Por preparar', 'Listos para servir']} /> : null}
      {active.isError ? (
        <RetryQueryError error={active.error} fallback="No se pudieron cargar los pedidos." onRetry={() => void active.refetch()} />
      ) : null}
      {/* Mientras carga, la silueta ocupa el lugar de las dos secciones; antes se
          veían las dos a la vez y, al irse la silueta, las secciones saltaban
          (CLS de 0,58 en el celular). */}
      {active.isPending ? null : (
        <>
          <KitchenSection
            title="Por preparar"
            orders={inKitchen}
            emptyTitle="Nada pendiente en cocina"
            isLoaded={active.isSuccess}
            now={now}
            flagFor={flagFor}
          />
          <KitchenSection
            title="Listos para servir"
            orders={ready}
            emptyTitle="Nada esperando a salir"
            isLoaded={active.isSuccess}
            now={now}
            flagFor={flagFor}
            isCollapsible
            isHiddenWhenEmptyOnPhone
          />
        </>
      )}
    </div>
  )
}
