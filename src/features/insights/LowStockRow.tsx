import type { LowStockItem } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/ui/badge'
import { formatQuantity, toNumber } from '@/services/format'

const PERCENT = 100

/** Un insumo bajo su mínimo: el estado escrito con ícono y cuánto falta. */
export function LowStockRow({ item }: { readonly item: LowStockItem }) {
  const level = Math.min(PERCENT, (toNumber(item.stock) / Math.max(toNumber(item.min_stock), 1)) * PERCENT)
  return (
    <li className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{item.name}</span>
        <Badge variant="destructive">
          <Icon name="critical" size={14} />
          Bajo mínimo
        </Badge>
      </div>
      <meter
        aria-label={`Stock de ${item.name} respecto del mínimo`}
        min={0}
        max={toNumber(item.min_stock)}
        value={toNumber(item.stock)}
        className="sr-only"
      />
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-destructive/15">
        <div className="h-full rounded-full bg-destructive" style={{ width: `${String(level)}%` }} />
      </div>
      <p className="m-0 text-xs text-muted-foreground">
        Quedan {formatQuantity(item.stock, item.unit)} de un mínimo de {formatQuantity(item.min_stock, item.unit)}; faltan{' '}
        {formatQuantity(item.missing, item.unit)}.
      </p>
    </li>
  )
}
