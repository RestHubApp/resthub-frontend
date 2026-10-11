import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { changePurchaseOrder, purchaseOrdersQuery } from '@/api/purchasing'
import type { PurchaseOrder } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { ListSkeleton } from '@/components/ListSkeleton'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { formatDateTime, formatMoney } from '@/services/format'
import { useTimeZone } from '@/store/session'
import { PurchaseOrderDialog } from './PurchaseOrderDialog'
import { ReceiveOrderDialog } from './ReceiveOrderDialog'
import { usePurchasingMutation } from './usePurchasingMutation'

interface PurchaseOrdersPanelProps {
  readonly canManage: boolean
}

const TONE: Record<PurchaseOrder['status'], string> = {
  draft: 'bg-muted text-foreground',
  sent: 'bg-primary/10 text-primary',
  received: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
}

/**
 * Las órdenes de compra: borrador, enviada, recibida o cancelada.
 *
 * Recibir una orden es lo que la vuelve stock: cada insumo que llegó entra al
 * libro como compra, con su costo real.
 */
export function PurchaseOrdersPanel({ canManage }: PurchaseOrdersPanelProps) {
  const timeZone = useTimeZone()
  const orders = useQuery(purchaseOrdersQuery)
  const [creating, setCreating] = useState(false)
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null)
  const change = usePurchasingMutation({
    mutationFn: (payload: { id: number; action: 'send' | 'cancel' }) => changePurchaseOrder(payload.id, payload.action),
    success: (order) => `Orden ${String(order.number)}: ${order.status_label.toLowerCase()}.`,
    failure: 'No se pudo cambiar la orden.',
  })
  const list = orders.data?.items ?? []

  return (
    <SectionCard
      title="Órdenes de compra"
      actions={canManage ? (
        <Button type="button" onClick={() => {
          setCreating(true)
        }}>
          <Icon name="agregar" size={16} />
          <span>Nueva orden</span>
        </Button>
      ) : undefined}
    >
      {orders.isPending ? <ListSkeleton label="Cargando órdenes…" count={3} itemClassName="h-16 rounded-lg" /> : null}
      {orders.isError ? <FormMessage tone="error">{errorMessage(orders.error, 'No se pudieron cargar las órdenes.')}</FormMessage> : null}
      {orders.isSuccess && list.length === 0 ? (
        <EmptyState title="Todavía no hay órdenes de compra" description="Arma una con lo que se está acabando." />
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {list.map((order) => (
          <li key={order.id} className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-input">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">OC {order.number} · {order.supplier_name}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[order.status]}`}>{order.status_label}</span>
            </div>
            <p className="m-0 text-sm text-muted-foreground">
              {order.lines.map((line) => line.ingredient_name).join(', ')} · {formatDateTime(order.created_at, timeZone)}
            </p>
            <p className="m-0 text-sm">
              Estimado {formatMoney(order.estimated_total)}
              {order.status === 'received' ? ` · Recibido ${formatMoney(order.received_total)}` : ''}
            </p>
            {canManage && (order.status === 'draft' || order.status === 'sent') ? (
              <div className="flex flex-wrap gap-2">
                {order.status === 'draft' ? (
                  <Button type="button" size="sm" variant="outline" disabled={change.isPending} onClick={() => {
                    change.mutate({ id: order.id, action: 'send' })
                  }}>
                    <Icon name="enviar" size={14} />
                    <span>Marcar enviada</span>
                  </Button>
                ) : null}
                <Button type="button" size="sm" variant="success" onClick={() => {
                  setReceiving(order)
                }}>
                  <Icon name="compra" size={14} />
                  <span>Recibir</span>
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={change.isPending} onClick={() => {
                  change.mutate({ id: order.id, action: 'cancel' })
                }}>
                  Cancelar
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <PurchaseOrderDialog open={creating} onClose={() => {
        setCreating(false)
      }} />
      <ReceiveOrderDialog order={receiving} onClose={() => {
        setReceiving(null)
      }} />
    </SectionCard>
  )
}
