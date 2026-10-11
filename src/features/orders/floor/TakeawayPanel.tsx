import { useQuery } from '@tanstack/react-query'

import { activeOrdersQuery } from '@/api/orders'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { QueryError } from '@/features/orders/QueryError'
import { OrderList } from './OrderList'

/** Los pedidos para llevar que todavia no se cobran, de todos los meseros. */
export function TakeawayPanel() {
  const active = useQuery(activeOrdersQuery)

  if (active.isPending) {
    return <ListSkeleton label="Cargando pedidos…" count={3} itemClassName="h-20 rounded-xl" />
  }
  if (active.isError) {
    return (
      <QueryError
        error={active.error}
        fallback="No se pudieron cargar los pedidos."
        onRetry={() => void active.refetch()}
      />
    )
  }
  const takeaway = active.data.filter((order) => order.type !== 'dine_in')
  if (takeaway.length === 0) {
    return (
      <EmptyState
        title="No hay pedidos para llevar ni delivery en curso"
        description="Usa el botón «Para llevar / Delivery» de arriba para tomar uno."
      />
    )
  }
  return <OrderList title="En curso" orders={takeaway} />
}
