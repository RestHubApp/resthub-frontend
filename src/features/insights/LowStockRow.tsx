import type { LowStockItem } from '../../api/types'
import Icon from '../../components/Icon'
import { formatQuantity, toNumber } from './format'

const PERCENT = 100

/** Un insumo bajo su mínimo: el estado escrito con ícono y cuánto falta. */
export default function LowStockRow({ item }: { readonly item: LowStockItem }) {
  const nivel = Math.min(PERCENT, (toNumber(item.stock) / Math.max(toNumber(item.min_stock), 1)) * PERCENT)
  return (
    <li className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{item.name}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          <Icon name="critico" size={14} />
          Bajo mínimo
        </span>
      </div>
      <div
        role="meter"
        aria-label={`Stock de ${item.name} respecto del mínimo`}
        aria-valuemin={0}
        aria-valuemax={toNumber(item.min_stock)}
        aria-valuenow={toNumber(item.stock)}
        className="h-2 overflow-hidden rounded-full bg-destructive/15"
      >
        <div className="h-full rounded-full bg-destructive" style={{ width: `${String(nivel)}%` }} />
      </div>
      <p className="m-0 text-xs text-muted-foreground">
        Quedan {formatQuantity(item.stock, item.unit)} de un mínimo de {formatQuantity(item.min_stock, item.unit)}; faltan{' '}
        {formatQuantity(item.missing, item.unit)}.
      </p>
    </li>
  )
}
