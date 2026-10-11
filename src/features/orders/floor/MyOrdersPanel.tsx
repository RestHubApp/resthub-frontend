import { useQuery } from '@tanstack/react-query'

import { MAX_ORDERS_PAGE, ordersQuery } from '@/api/orders'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { useSession, useTimeZone } from '@/store/session'
import { isActive } from '@/features/orders/orderLabels'
import { QueryError } from '@/features/orders/QueryError'
import { OrderList } from './OrderList'
import { todayIn } from '@/services/format'

/** Lo que tomo el mesero hoy: primero lo que sigue en curso, despues lo cerrado. */
export function MyOrdersPanel() {
  const userId = useSession((state) => state.account?.user.id)
  const timeZone = useTimeZone()
  const today = todayIn(timeZone)
  const params = { waiter_id: userId, date_from: today, date_to: today, limit: MAX_ORDERS_PAGE }
  const orders = useQuery({ ...ordersQuery(params), enabled: userId !== undefined })

  if (orders.isPending) {
    return <ListSkeleton label="Cargando tus pedidos…" count={3} itemClassName="h-20 rounded-xl" />
  }
  if (orders.isError) {
    return (
      <QueryError
        error={orders.error}
        fallback="No se pudieron cargar tus pedidos."
        onRetry={() => void orders.refetch()}
      />
    )
  }
  if (orders.data.items.length === 0) {
    return (
      <EmptyState
        title="Todavía no tomaste pedidos hoy"
        description="Toca una mesa libre para empezar."
      />
    )
  }
  const inProgress = orders.data.items.filter((order) => isActive(order.status))
  const closed = orders.data.items.filter((order) => !isActive(order.status))

  return (
    <div className="flex flex-col gap-5">
      <OrderList title="En curso" orders={inProgress} />
      <OrderList title="Cerrados hoy" orders={closed} />
    </div>
  )
}
