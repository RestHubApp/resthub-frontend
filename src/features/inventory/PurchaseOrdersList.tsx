import type { PurchaseOrder } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { ErrorMessage } from '@/components/ErrorMessage'
import { PurchaseOrderCard } from './PurchaseOrderCard'

interface PurchaseOrdersListProps {
  /** El estado de la consulta de órdenes. */
  readonly status: 'pending' | 'error' | 'success'
  readonly error: unknown
  readonly orders: readonly PurchaseOrder[]
  readonly canManage: boolean
  readonly isBusy: boolean
  readonly onChange: (id: number, action: 'send' | 'cancel') => void
  readonly onReceive: (order: PurchaseOrder) => void
}

/** La lista de órdenes de compra, con su carga, su error y su vacío. */
export function PurchaseOrdersList({ status, error, orders, canManage, isBusy, onChange, onReceive }: PurchaseOrdersListProps) {
  return (
    <>
      {status === 'pending' ? <ListSkeleton label="Cargando órdenes…" count={3} itemClassName="h-16 rounded-lg" /> : null}
      <ErrorMessage isError={status === 'error'} error={error} fallback="No se pudieron cargar las órdenes." />
      {status === 'success' && orders.length === 0 ? (
        <EmptyState title="Todavía no hay órdenes de compra" description="Arma una con lo que se está acabando." />
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {orders.map((order) => (
          <PurchaseOrderCard
            key={order.id}
            order={order}
            canManage={canManage}
            isBusy={isBusy}
            onSend={() => {
              onChange(order.id, 'send')
            }}
            onReceive={() => {
              onReceive(order)
            }}
            onCancel={() => {
              onChange(order.id, 'cancel')
            }}
          />
        ))}
      </ul>
    </>
  )
}
