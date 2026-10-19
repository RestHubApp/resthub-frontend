import type { StockCount } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { CountSheet } from './CountSheet'
import { DifferencesReport } from './DifferencesReport'

/** Lo que muestra un conteo según su estado: la lista para contar, el reporte o que se canceló. */
export function CountBody({ count, canManage }: { readonly count: StockCount; readonly canManage: boolean }) {
  switch (count.status) {
    case 'draft': {
      return <CountSheet count={count} canEdit={canManage} />
    }
    case 'closed': {
      return <DifferencesReport countId={count.id} />
    }
    case 'cancelled': {
      return <EmptyState title="Este conteo se canceló." description="No ajustó el stock de ningún insumo." />
    }
  }
}
