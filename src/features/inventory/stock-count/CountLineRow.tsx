import type { StockCountLine } from '@/api/types'
import { packageName } from '@/features/inventory/packaging'
import { CountedBadge } from './CountedBadge'
import { unitOf } from './countEntry'
import { CountLineForm } from './CountLineForm'

interface CountLineRowProps {
  readonly countId: number
  readonly line: StockCountLine
  /** Sin permiso para contar, la línea solo muestra si está contada. */
  readonly canEdit: boolean
}

/**
 * Un insumo de la lista para contar.
 *
 * No muestra lo que el sistema espera: quien cuenta escribe lo que ve, sin
 * redondear hacia el número que ya conoce.
 */
export function CountLineRow({ countId, line, canEdit }: CountLineRowProps) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h3 className="m-0 text-base font-semibold">{line.ingredient_name}</h3>
          {line.packaging === null ? null : (
            <p className="m-0 text-sm text-muted-foreground">{packageName(line.packaging, unitOf(line))}</p>
          )}
        </div>
        <CountedBadge line={line} />
      </div>
      {canEdit ? <CountLineForm countId={countId} line={line} /> : null}
    </li>
  )
}
