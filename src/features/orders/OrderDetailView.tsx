import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { orderQuery } from '@/api/orders'
import { BackLink } from '@/components/BackLink'
import { EmptyState } from '@/components/EmptyState'
import { paths } from '@/services/paths'
import { LiveIndicator } from './LiveIndicator'
import { OrderDetailBody } from './OrderDetailBody'
import { QueryError } from './QueryError'
import { useAllergyFlags } from './useAllergyFlags'
import { useLiveUpdates } from './useLiveUpdates'

/**
 * Un pedido: sus platos, su estado y el paso que sigue.
 *
 * Se llega tocando una mesa ocupada, desde "Mis pedidos" o desde el tablero.
 * Se actualiza solo: si la cocina lo marca listo, el boton "Marcar servido"
 * aparece sin recargar.
 */
export function OrderDetailView() {
  const orderId = Number(useParams()['orderId'])
  const live = useLiveUpdates()
  const orderResult = useQuery({ ...orderQuery(orderId), enabled: Number.isInteger(orderId) })
  const notes = useAllergyFlags(Number.isInteger(orderId) ? [orderId] : [])

  if (orderResult.isPending) {
    return <EmptyState title="Cargando el pedido…" />
  }
  if (orderResult.isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to={paths.orders.list} label="Pedidos" />
        <QueryError error={orderResult.error} fallback="No se pudo cargar el pedido." onRetry={() => void orderResult.refetch()} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink to={paths.orders.list} label="Pedidos" />
        <LiveIndicator status={live} />
      </div>
      <OrderDetailBody order={orderResult.data} flagFor={notes.flagFor} />
    </div>
  )
}
