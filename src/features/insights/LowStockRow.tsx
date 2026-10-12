import type { LowStockItem } from '@/api/types'
import { formatQuantity } from '@/services/format'

/** Un insumo bajo su mínimo, en una línea: cuánto queda y cuánto falta. El detalle y la compra están en la reposición. */
export function LowStockRow({ item }: { readonly item: LowStockItem }) {
  return (
    <li className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
      <span className="text-sm font-medium">{item.name}</span>
      <p className="m-0 text-xs text-muted-foreground">
        Quedan {formatQuantity(item.stock, item.unit)} de un mínimo de {formatQuantity(item.min_stock, item.unit)}; faltan{' '}
        {formatQuantity(item.missing, item.unit)}.
      </p>
    </li>
  )
}
