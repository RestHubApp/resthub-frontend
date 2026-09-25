import { useQuery } from '@tanstack/react-query'

import { fetchOrders, MAX_ORDERS_PAGE, orderListQueryKey } from '../../../api/orders'
import EmptyState from '../../../components/EmptyState'
import { useSession, useTimeZone } from '../../../store/session'
import { isActive } from '../orderLabels'
import QueryError from '../QueryError'
import OrderList from './OrderList'
import { todayIn } from '../../../services/format'

/** Lo que tomo el mesero hoy: primero lo que sigue en curso, despues lo cerrado. */
export default function MyOrdersPanel() {
  const userId = useSession((state) => state.account?.user.id)
  const timeZone = useTimeZone()
  const hoy = todayIn(timeZone)
  const params = { waiter_id: userId, date_from: hoy, date_to: hoy, limit: MAX_ORDERS_PAGE }
  const pedidos = useQuery({
    queryKey: orderListQueryKey(params),
    queryFn: () => fetchOrders(params),
    enabled: userId !== undefined,
  })

  if (pedidos.isPending) {
    return <EmptyState title="Cargando tus pedidos…" />
  }
  if (pedidos.isError) {
    return (
      <QueryError
        error={pedidos.error}
        fallback="No se pudieron cargar tus pedidos."
        onRetry={() => void pedidos.refetch()}
      />
    )
  }
  if (pedidos.data.items.length === 0) {
    return (
      <EmptyState
        title="Todavía no tomaste pedidos hoy"
        description="Toca una mesa libre para empezar."
      />
    )
  }
  const enCurso = pedidos.data.items.filter((order) => isActive(order.status))
  const cerrados = pedidos.data.items.filter((order) => !isActive(order.status))

  return (
    <div className="flex flex-col gap-5">
      <OrderList title="En curso" orders={enCurso} />
      <OrderList title="Cerrados hoy" orders={cerrados} />
    </div>
  )
}
