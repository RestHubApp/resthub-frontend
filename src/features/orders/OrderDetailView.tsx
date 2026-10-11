import { useQuery } from '@tanstack/react-query'
import { Suspense, useState } from 'react'
import { PERMISSION } from '@/api/permissions'
import { lazyNamed } from '@/components/lazyNamed'
import { useParams } from 'react-router'

import { orderQuery } from '@/api/orders'
import { EmptyState } from '@/components/EmptyState'
import { useOrderNoteFlags } from '@/hooks/useOrderNoteFlags'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import { BackLink } from '@/components/BackLink'
import { OrderActions } from './detail/OrderActions'
import { DeliveryCard } from './detail/DeliveryCard'
import { OrderClosedInfo } from './detail/OrderClosedInfo'
import { OrderHeader } from './detail/OrderHeader'
import { OrderItems } from './detail/OrderItems'
import { PrintLinks } from './detail/PrintLinks'
import { TableMoves } from './detail/TableMoves'
import { LiveIndicator } from './LiveIndicator'
import { isActive } from './orderLabels'
import { QueryError } from './QueryError'
import { useLiveUpdates } from './useLiveUpdates'

// Los diálogos traen react-hook-form y zod: se bajan al abrirlos, no con el pedido.
const CancelOrderDialog = lazyNamed(() => import('./CancelOrderDialog'), 'CancelOrderDialog')
const ChargeDialog = lazyNamed(() => import('./charge/ChargeDialog'), 'ChargeDialog')

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
  const pedido = useQuery({ ...orderQuery(orderId), enabled: Number.isInteger(orderId) })
  // Las alergias las ve el encargado; useLiveUpdates ya refresca las notas.
  const canViewAllergies = useCan(PERMISSION.insightsRead)
  const notes = useOrderNoteFlags(Number.isInteger(orderId) ? [orderId] : [], { enabled: canViewAllergies, live: false })
  const [dialog, setDialog] = useState<'charge' | 'cancel' | null>(null)
  const close = () => {
    setDialog(null)
  }

  if (pedido.isPending) {
    return <EmptyState title="Cargando el pedido…" />
  }
  if (pedido.isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to={paths.orders.list} label="Pedidos" />
        <QueryError error={pedido.error} fallback="No se pudo cargar el pedido." onRetry={() => void pedido.refetch()} />
      </div>
    )
  }
  const order = pedido.data

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink to={paths.orders.list} label="Pedidos" />
        <LiveIndicator status={live} />
      </div>
      <OrderHeader order={order} flagFor={notes.flagFor} />
      <DeliveryCard order={order} />
      <OrderActions
        order={order}
        onCharge={() => {
          setDialog('charge')
        }}
        onCancel={() => {
          setDialog('cancel')
        }}
      />
      {order.type === 'dine_in' && isActive(order.status) ? <TableMoves order={order} /> : null}
      <PrintLinks order={order} />
      <OrderClosedInfo order={order} />
      <OrderItems order={order} flagFor={notes.flagFor} />
      <Suspense fallback={null}>
        {dialog === 'charge' ? <ChargeDialog order={order} onClose={close} /> : null}
        {dialog === 'cancel' ? <CancelOrderDialog order={order} onClose={close} /> : null}
      </Suspense>
    </div>
  )
}
