import { Link } from 'react-router'

import type { TableState } from '@/api/types'
import { Icon } from '@/components/Icon'
import { tableName } from '@/api/tables'
import { OrderStatusBadge } from '@/features/orders/OrderStatusBadge'
import { formatMoney } from '@/services/format'
import { dishCount } from '@/features/orders/orderLabels'
import { paths } from '@/services/paths'

interface TableCardProps {
  readonly table: TableState
}

const BASE =
  'flex min-h-28 flex-col gap-1 rounded-xl p-3.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'

// Con el texto grande («Muy grande», 125 %), «Servido, por cobrar» no cabe en una
// línea dentro de la tarjeta: baja de línea en vez de salirse de su borde.
const WRAPPING_BADGE = 'h-auto min-w-0 shrink whitespace-normal py-0.5 text-left leading-tight'

/**
 * Una mesa del salon, que es tambien el boton para trabajar en ella.
 *
 * Libre, lleva a tomar el pedido; ocupada, al pedido que tiene. Una mesa con
 * el pedido listo se marca con un borde verde y lo dice: es la que el mesero
 * tiene que atender primero.
 */
export function TableCard({ table }: TableCardProps) {
  const order = table.active_order
  const name = tableName(table.label)

  if (order === null) {
    return (
      <Link
        to={paths.orders.newForTable(table.id)}
        className={`${BASE} border border-dashed border-input bg-card hover:border-primary hover:bg-secondary/40`}
      >
        <span className="font-heading text-xl font-bold">{name}</span>
        <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-success">
          <Icon name="add" size={16} />
          Libre
        </span>
      </Link>
    )
  }

  return (
    <Link
      to={paths.orders.detail(order.id)}
      className={`${BASE} bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] ${order.status === 'ready' ? 'ring-2 ring-success' : 'ring-1 ring-primary/25'}`}
    >
      <span className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <span className="max-w-full font-heading text-xl font-bold break-words">{name}</span>
        <OrderStatusBadge status={order.status} className={WRAPPING_BADGE} />
      </span>
      <span className="text-sm font-semibold tabular-nums">
        #{order.number} · {formatMoney(order.total)}
      </span>
      {order.status === 'ready' ? (
        <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-success">
          <Icon name="serve" size={16} />
          Falta servirlo
        </span>
      ) : (
        <span className="mt-auto truncate text-sm text-foreground/75">
          {dishCount(order.item_count)} · {order.waiter_name}
        </span>
      )}
    </Link>
  )
}
