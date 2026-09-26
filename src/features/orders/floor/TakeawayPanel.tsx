import { useQuery } from '@tanstack/react-query'

import { activeOrdersQuery } from '../../../api/orders'
import EmptyState from '../../../components/EmptyState'
import ListSkeleton from '../../../components/ListSkeleton'
import QueryError from '../QueryError'
import OrderList from './OrderList'

/** Los pedidos para llevar que todavia no se cobran, de todos los meseros. */
export default function TakeawayPanel() {
  const activos = useQuery(activeOrdersQuery)

  if (activos.isPending) {
    return <ListSkeleton label="Cargando pedidos…" count={3} itemClassName="h-20 rounded-xl" />
  }
  if (activos.isError) {
    return (
      <QueryError
        error={activos.error}
        fallback="No se pudieron cargar los pedidos."
        onRetry={() => void activos.refetch()}
      />
    )
  }
  const paraLlevar = activos.data.filter((order) => order.type !== 'dine_in')
  if (paraLlevar.length === 0) {
    return (
      <EmptyState
        title="No hay pedidos para llevar ni delivery en curso"
        description="Usa el botón «Para llevar / Delivery» de arriba para tomar uno."
      />
    )
  }
  return <OrderList title="En curso" orders={paraLlevar} />
}
