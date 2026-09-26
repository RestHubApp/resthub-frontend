import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'

import { fetchOrder, orderQueryKey } from '../../api/orders'
import EmptyState from '../../components/EmptyState'
import { useOrderNoteFlags } from '../../hooks/useOrderNoteFlags'
import { useCan } from '../../store/session'
import BackLink from '../../components/BackLink'
import CancelOrderDialog from './CancelOrderDialog'
import ChargeDialog from './charge/ChargeDialog'
import OrderActions from './detail/OrderActions'
import DeliveryCard from './detail/DeliveryCard'
import OrderClosedInfo from './detail/OrderClosedInfo'
import OrderHeader from './detail/OrderHeader'
import OrderItems from './detail/OrderItems'
import PrintLinks from './detail/PrintLinks'
import TableMoves from './detail/TableMoves'
import LiveIndicator from './LiveIndicator'
import { isActive } from './orderLabels'
import QueryError from './QueryError'
import { useLiveUpdates } from './useLiveUpdates'

/**
 * Un pedido: sus platos, su estado y el paso que sigue.
 *
 * Se llega tocando una mesa ocupada, desde "Mis pedidos" o desde el tablero.
 * Se actualiza solo: si la cocina lo marca listo, el boton "Marcar servido"
 * aparece sin recargar.
 */
export default function OrderDetailView() {
  const orderId = Number(useParams().orderId)
  const live = useLiveUpdates()
  const pedido = useQuery({
    queryKey: orderQueryKey(orderId),
    queryFn: () => fetchOrder(orderId),
    enabled: Number.isInteger(orderId),
  })
  // Las alergias las ve el encargado; useLiveUpdates ya refresca las notas.
  const veAlergias = useCan('insights.read')
  const notas = useOrderNoteFlags(Number.isInteger(orderId) ? [orderId] : [], { enabled: veAlergias, live: false })
  const [dialogo, setDialogo] = useState<'charge' | 'cancel' | null>(null)
  const cerrar = () => {
    setDialogo(null)
  }

  if (pedido.isPending) {
    return <EmptyState title="Cargando el pedido…" />
  }
  if (pedido.isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to="/pedidos" label="Pedidos" />
        <QueryError error={pedido.error} fallback="No se pudo cargar el pedido." onRetry={() => void pedido.refetch()} />
      </div>
    )
  }
  const order = pedido.data

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink to="/pedidos" label="Pedidos" />
        <LiveIndicator status={live} />
      </div>
      <OrderHeader order={order} flagFor={notas.flagFor} />
      <DeliveryCard order={order} />
      <OrderActions
        order={order}
        onCharge={() => {
          setDialogo('charge')
        }}
        onCancel={() => {
          setDialogo('cancel')
        }}
      />
      {order.type === 'dine_in' && isActive(order.status) ? <TableMoves order={order} /> : null}
      <PrintLinks order={order} />
      <OrderClosedInfo order={order} />
      <OrderItems order={order} flagFor={notas.flagFor} />
      <ChargeDialog order={dialogo === 'charge' ? order : null} onClose={cerrar} />
      <CancelOrderDialog order={dialogo === 'cancel' ? order : null} onClose={cerrar} />
    </div>
  )
}
