import { cn } from 'cn'
import { formatMoney, formatPercent } from '@/services/format'


interface RecipeTotalsProps {
  readonly price: number
  readonly cost: number
  readonly hasLines: boolean
}

/**
 * Precio, costo y margen de una porción, al día con lo que se escribe.
 *
 * El margen se recalcula con cada tecla; se anuncia con cortesía, sin
 * interrumpir a quien está escribiendo.
 */
export function RecipeTotals({ price, cost, hasLines }: RecipeTotalsProps) {
  const margin = price - cost
  const percentage = price > 0 ? (margin / price) * 100 : 0
  const isLost = margin < 0

  return (
    <dl
      aria-live="polite"
      className="m-0 grid grid-cols-2 gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 sm:grid-cols-4"
    >
      <div className="flex flex-col gap-0.5">
        <dt className="text-sm text-muted-foreground">Precio</dt>
        <dd className="m-0 text-lg font-semibold tabular-nums">{formatMoney(price)}</dd>
      </div>
      <div className="flex flex-col gap-0.5">
        <dt className="text-sm text-muted-foreground">Costo por porción</dt>
        <dd className="m-0 text-lg font-semibold tabular-nums">{hasLines ? formatMoney(cost) : '—'}</dd>
      </div>
      <div className="flex flex-col gap-0.5">
        <dt className="text-sm text-muted-foreground">Margen</dt>
        <dd className={cn('m-0 text-lg font-semibold tabular-nums', isLost && 'text-destructive')}>
          {hasLines ? formatMoney(margin) : '—'}
        </dd>
      </div>
      <div className="flex flex-col gap-0.5">
        <dt className="text-sm text-muted-foreground">% margen</dt>
        <dd className={cn('m-0 text-lg font-semibold tabular-nums', isLost && 'text-destructive')}>
          {hasLines ? formatPercent(percentage.toFixed(1)) : '—'}
        </dd>
      </div>
    </dl>
  )
}
