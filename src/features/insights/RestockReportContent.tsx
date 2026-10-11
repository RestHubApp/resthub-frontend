import { useState } from 'react'

import type { RestockAction, RestockItem, RestockReport } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { RestockItemCard } from './RestockItemCard'
import { RestockNotice } from './RestockNotice'
import { RestockSummary } from './RestockSummary'

interface RestockReportContentProps {
  readonly report: RestockReport
  /** Se están pidiendo recomendaciones nuevas: el contenido se atenúa. */
  readonly isUpdating: boolean
}

// Lo más urgente arriba; a igual urgencia, lo que se acaba antes.
function byUrgency(a: RestockItem, b: RestockItem): number {
  return b.urgency_score - a.urgency_score || Number(a.coverage_days ?? Infinity) - Number(b.coverage_days ?? Infinity)
}

// Sin filtro, lo que puede esperar queda plegado: la lista empieza por lo que pide atención.
function visible(item: RestockItem, filter: RestockAction | null, viewWait: boolean): boolean {
  if (filter !== null) {
    return item.action === filter
  }
  return viewWait || item.action !== 'wait'
}

/** El reporte de reposición: aviso, resumen por acción filtrable y la lista de insumos por urgencia. */
export function RestockReportContent({ report, isUpdating }: RestockReportContentProps) {
  const [filter, setFilter] = useState<RestockAction | null>(null)
  const [isViewingWait, setIsViewingWait] = useState(false)
  const visibleItems = report.items.filter((item) => visible(item, filter, isViewingWait)).sort(byUrgency)
  const inWait = filter === null && !isViewingWait ? report.items.filter((item) => item.action === 'wait').length : 0

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${isUpdating ? 'opacity-50' : ''}`}>
      <RestockNotice report={report} />
      <RestockSummary counts={report.counts} selected={filter} onSelect={setFilter} />
      {visibleItems.length === 0 ? (
        <EmptyState title="No hay insumos con esa acción." />
      ) : (
        <ul aria-label="Recomendaciones por insumo" className="m-0 flex list-none flex-col gap-3 p-0">
          {visibleItems.map((item) => (
            <RestockItemCard key={item.ingredient_id} item={item} />
          ))}
        </ul>
      )}
      {inWait > 0 ? (
        <Button type="button" variant="outline" className="self-start" onClick={() => { setIsViewingWait(true) }}>
          <Icon name="expand" size={16} />
          <span>{`Ver también los ${String(inWait)} insumos que pueden esperar`}</span>
        </Button>
      ) : null}
    </div>
  )
}
