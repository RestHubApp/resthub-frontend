import type { PurchaseOrder } from '@/api/types'
import { formatDateTime, formatMoney } from '@/services/format'
import { useTimeZone } from '@/store/session'
import { PurchaseOrderActions } from './PurchaseOrderActions'

const TONE: Record<PurchaseOrder['status'], string> = {
  draft: 'bg-muted text-foreground',
  sent: 'bg-primary/10 text-primary',
  received: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
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
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[order.status]}`}>{order.status_label}</span>
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
