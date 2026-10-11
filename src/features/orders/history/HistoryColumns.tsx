import type { OrderResponse } from '@/api/types'
import type { DataColumn } from '@/components/DataTable'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatMoney } from '@/services/format'
import { orderPlace } from '@/features/orders/orderLabels'
import { OrderStatusBadge } from '@/features/orders/OrderStatusBadge'

/** Las columnas de la tabla del historial, con las fechas en la zona horaria del local. */
export function buildColumns(timeZone: string): DataColumn<OrderResponse>[] {
  return [

  { id: 'numero', header: 'N.º', cell: (order) => <span className="font-semibold tabular-nums">#{order.number}</span> },
  { id: 'fecha', header: 'Abierto', cell: (order) => formatDateTime(order.created_at, timeZone) },
  { id: 'lugar', header: 'Mesa o cliente', cell: (order) => orderPlace(order), className: 'whitespace-normal' },
  { id: 'mesero', header: 'Mesero', cell: (order) => order.waiter_name },
  { id: 'estado', header: 'Estado', cell: (order) => <OrderStatusBadge status={order.status} /> },
  { id: 'pago', header: 'Pago', cell: (order) => order.payment_method_label ?? '—' },
  { id: 'total', header: 'Total', cell: (order) => formatMoney(order.total), className: 'text-right tabular-nums' },
  {
    id: 'detalle',
    header: 'Detalle',
    cell: (order, { isExpanded, toggleExpanded }) => (
      <Button
        type="button"
        variant="ghost"
        className="h-10 px-3"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} el detalle del pedido #${String(order.number)}`}
        onClick={toggleExpanded}
      >
        <Icon name={isExpanded ? 'hide' : 'view'} size={16} />
        <span>{isExpanded ? 'Ocultar' : 'Ver'}</span>
      </Button>
    ),
  },
  ]
}
