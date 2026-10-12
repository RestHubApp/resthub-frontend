import type { PurchaseOrder } from '@/api/types'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { formatDateTime, formatMoney } from '@/services/format'
import { useTimeZone } from '@/store/session'
import { PurchaseOrderActions } from './PurchaseOrderActions'

const STATUS_VARIANTS: Record<PurchaseOrder['status'], BadgeVariant> = {
  draft: 'muted',
  sent: 'info',
  received: 'success',
  cancelled: 'destructive',
}

interface PurchaseOrderCardProps {
  readonly order: PurchaseOrder
  readonly canManage: boolean
  readonly isBusy: boolean
  readonly onSend: () => void
  readonly onReceive: () => void
  readonly onCancel: () => void
}

/** Una orden de compra: proveedor, estado, insumos, totales y, si sigue abierta, sus acciones. */
export function PurchaseOrderCard({ order, canManage, isBusy, onSend, onReceive, onCancel }: PurchaseOrderCardProps) {
  const timeZone = useTimeZone()
  const isOpen = order.status === 'draft' || order.status === 'sent'

  return (
    <li className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-input">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">OC {order.number} · {order.supplier_name}</span>
        <Badge variant={STATUS_VARIANTS[order.status]} className="font-semibold">{order.status_label}</Badge>
      </div>
      <p className="m-0 text-sm text-muted-foreground">
        {order.lines.map((line) => line.ingredient_name).join(', ')} · {formatDateTime(order.created_at, timeZone)}
      </p>
      <p className="m-0 text-sm">
        Estimado {formatMoney(order.estimated_total)}
        {order.status === 'received' ? ` · Recibido ${formatMoney(order.received_total)}` : ''}
      </p>
      {canManage && isOpen ? (
        <PurchaseOrderActions
          status={order.status}
          isBusy={isBusy}
          onSend={onSend}
          onReceive={onReceive}
          onCancel={onCancel}
        />
      ) : null}
    </li>
  )
}
