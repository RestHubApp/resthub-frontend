import { Link } from 'react-router'

import type { TableState } from '../../../api/types'
import Icon from '../../../components/Icon'
import { tableName } from '../../../api/tables'
import OrderStatusBadge from '../OrderStatusBadge'
import { formatMoney } from '../../../services/format'
import { dishCount } from '../orderLabels'

interface TableCardProps {
  readonly table: TableState
}

const BASE =
  'flex min-h-28 flex-col gap-1 rounded-xl p-3.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * Una mesa del salon, que es tambien el boton para trabajar en ella.
 *
 * Libre, lleva a tomar el pedido; ocupada, al pedido que tiene. Una mesa con
 * el pedido listo se marca con un borde verde y lo dice: es la que el mesero
 * tiene que atender primero.
 */
export default function TableCard({ table }: TableCardProps) {
  const order = table.active_order
  const nombre = tableName(table.label)

  if (order === null) {
    return (
      <Link
        to={`/pedidos/nuevo?mesa=${String(table.id)}`}
        className={`${BASE} border border-dashed border-input bg-card hover:border-primary hover:bg-secondary/40`}
      >
        <span className="font-heading text-xl font-bold">{nombre}</span>
        <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-success">
          <Icon name="agregar" size={16} />
          Libre
        </span>
      </Link>
    )
  }

  return (
    <Link
      to={`/pedidos/${String(order.id)}`}
      className={`${BASE} bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] ${order.status === 'ready' ? 'ring-2 ring-success' : 'ring-1 ring-primary/25'}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-heading text-xl font-bold">{nombre}</span>
        <OrderStatusBadge status={order.status} label={order.status_label} />
      </span>
      <span className="text-sm font-semibold tabular-nums">
        #{order.number} · {formatMoney(order.total)}
      </span>
      {order.status === 'ready' ? (
        <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-success">
          <Icon name="servir" size={16} />
          Listo para servir
        </span>
      ) : (
        <span className="mt-auto truncate text-sm text-foreground/75">
          {dishCount(order.item_count)} · {order.waiter_name}
        </span>
      )}
    </Link>
  )
}
