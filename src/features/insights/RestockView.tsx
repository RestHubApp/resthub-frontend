import { useState } from 'react'

import type { RestockAction, RestockItem } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { PanelHeader } from './PanelHeader'
import { ReportState } from './ReportState'
import { RestockItemCard } from './RestockItemCard'
import { RestockNotice } from './RestockNotice'
import { RestockSummary } from './RestockSummary'
import { useRestock } from './useRestock'

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

/** Reposición inteligente: qué comprar y cuándo, según el consumo y las mermas. */
export function RestockView() {
  const { recommendation, update } = useRestock()
  const [filter, setFilter] = useState<RestockAction | null>(null)
  const [viewWait, setViewWait] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        description="Qué insumos comprar y cuándo, según el stock, el consumo de las últimas semanas y las mermas."
        actions={
          <Button type="button" size="lg" className="h-10 px-4" disabled={update.isPending} onClick={() => { update.mutate() }}>
            <Icon name="update" size={16} className={update.isPending ? 'animate-spin' : undefined} />
            <span>{update.isPending ? 'Actualizando…' : 'Actualizar recomendaciones'}</span>
          </Button>
        }
      />
      {update.isPending ? (
        <p role="status" className="m-0 text-sm text-muted-foreground">
          Decidiendo insumo por insumo. Con la IA puede tardar varios segundos.
        </p>
      ) : null}
      {update.isError ? (
        <FormMessage tone="error">{errorMessage(update.error, 'No se pudieron actualizar las recomendaciones.')}</FormMessage>
      ) : null}
      <ReportState data={recommendation.data} error={recommendation.error} errorText="No se pudo cargar la reposición.">
        {(report) => {
          const visibles = report.items.filter((item) => visible(item, filter, viewWait)).sort(byUrgency)
          const inWait = filter === null && !viewWait ? report.items.filter((item) => item.action === 'wait').length : 0
          return (
            <div className={`flex flex-col gap-6 transition-opacity ${update.isPending ? 'opacity-50' : ''}`}>
              <RestockNotice report={report} />
              <RestockSummary counts={report.counts} selected={filter} onSelect={setFilter} />
              {visibles.length === 0 ? (
                <EmptyState title="No hay insumos con esa acción." />
              ) : (
                <ul aria-label="Recomendaciones por insumo" className="m-0 flex list-none flex-col gap-3 p-0">
                  {visibles.map((item) => (
                    <RestockItemCard key={item.ingredient_id} item={item} />
                  ))}
                </ul>
              )}
              {inWait > 0 ? (
                <Button type="button" variant="outline" className="self-start" onClick={() => { setViewWait(true) }}>
                  <Icon name="expand" size={16} />
                  <span>{`Ver también los ${String(inWait)} insumos que pueden esperar`}</span>
                </Button>
              ) : null}
            </div>
          )
        }}
      </ReportState>
    </div>
  )
}
