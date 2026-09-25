import { cn } from 'cn'

import { formatMoney, formatPercent } from '../../services/money'

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
export default function RecipeTotals({ price, cost, hasLines }: RecipeTotalsProps) {
  const margen = price - cost
  const porcentaje = price > 0 ? (margen / price) * 100 : 0
  const perdida = margen < 0

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
        <dd className={cn('m-0 text-lg font-semibold tabular-nums', perdida && 'text-destructive')}>
          {hasLines ? formatMoney(margen) : '—'}
        </dd>
      </div>
      <div className="flex flex-col gap-0.5">
        <dt className="text-sm text-muted-foreground">% margen</dt>
        <dd className={cn('m-0 text-lg font-semibold tabular-nums', perdida && 'text-destructive')}>
          {hasLines ? formatPercent(porcentaje.toFixed(1)) : '—'}
        </dd>
      </div>
    </dl>
  )
}
