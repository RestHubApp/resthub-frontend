import { Link } from 'react-router'

import type { StockCountStatus, StockCountSummary } from '@/api/types'
import { StatusBadge, type StatusTone } from '@/components/StatusBadge'
import { paths } from '@/services/paths'
import { useTimeZone } from '@/store/session'
import { countDescription } from './countSummary'

const TONES: Record<StockCountStatus, StatusTone> = { draft: 'pending', closed: 'completed', cancelled: 'cancelled' }

/** Un conteo del historial: abre su lista para contar o su reporte de diferencias. */
export function StockCountRow({ count }: { readonly count: StockCountSummary }) {
  const timeZone = useTimeZone()
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted/60">
      <div className="flex min-w-0 flex-col">
        <Link to={paths.inventory.count(count.id)} className="font-medium underline-offset-4 hover:underline">
          Conteo #{count.number}
        </Link>
        <span className="text-sm text-muted-foreground">{countDescription(count, timeZone)}</span>
      </div>
      <StatusBadge label={count.status_label} tone={TONES[count.status]} />
    </li>
  )
}
