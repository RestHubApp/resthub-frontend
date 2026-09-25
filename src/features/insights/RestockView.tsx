import { useState } from 'react'

import type { RestockAction, RestockItem } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import PanelHeader from './PanelHeader'
import ReportState from './ReportState'
import RestockItemCard from './RestockItemCard'
import RestockNotice from './RestockNotice'
import RestockSummary from './RestockSummary'
import { useRestock } from './useRestock'

// Lo más urgente arriba; a igual urgencia, lo que se acaba antes.
function byUrgency(a: RestockItem, b: RestockItem): number {
  return b.urgency_score - a.urgency_score || Number(a.coverage_days ?? Infinity) - Number(b.coverage_days ?? Infinity)
}

// Sin filtro, lo que puede esperar queda plegado: la lista empieza por lo que pide atención.
function visible(item: RestockItem, filtro: RestockAction | null, verEspera: boolean): boolean {
  if (filtro !== null) {
    return item.action === filtro
  }
  return verEspera || item.action !== 'wait'
}

/** Reposición inteligente: qué comprar y cuándo, según el consumo y las mermas. */
export default function RestockView() {
  const { recomendacion, actualizar } = useRestock()
  const [filtro, setFiltro] = useState<RestockAction | null>(null)
  const [verEspera, setVerEspera] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        description="Qué insumos comprar y cuándo, según el stock, el consumo de las últimas semanas y las mermas."
        actions={
          <Button type="button" size="lg" className="h-10 px-4" disabled={actualizar.isPending} onClick={() => { actualizar.mutate() }}>
            <Icon name="actualizar" size={16} className={actualizar.isPending ? 'animate-spin' : undefined} />
            <span>{actualizar.isPending ? 'Actualizando…' : 'Actualizar recomendaciones'}</span>
          </Button>
        }
      />
      {actualizar.isPending ? (
        <p role="status" className="m-0 text-sm text-muted-foreground">
          Decidiendo insumo por insumo. Con la IA puede tardar varios segundos.
        </p>
      ) : null}
      {actualizar.isError ? (
        <FormMessage tone="error">{errorMessage(actualizar.error, 'No se pudieron actualizar las recomendaciones.')}</FormMessage>
      ) : null}
      <ReportState data={recomendacion.data} error={recomendacion.error} errorText="No se pudo cargar la reposición.">
        {(report) => {
          const visibles = report.items.filter((item) => visible(item, filtro, verEspera)).sort(byUrgency)
          const enEspera = filtro === null && !verEspera ? report.items.filter((item) => item.action === 'wait').length : 0
          return (
            <div className={`flex flex-col gap-6 transition-opacity ${actualizar.isPending ? 'opacity-50' : ''}`}>
              <RestockNotice report={report} />
              <RestockSummary counts={report.counts} selected={filtro} onSelect={setFiltro} />
              {visibles.length === 0 ? (
                <EmptyState title="No hay insumos con esa acción." />
              ) : (
                <ul aria-label="Recomendaciones por insumo" className="m-0 flex list-none flex-col gap-3 p-0">
                  {visibles.map((item) => (
                    <RestockItemCard key={item.ingredient_id} item={item} />
                  ))}
                </ul>
              )}
              {enEspera > 0 ? (
                <Button type="button" variant="outline" className="self-start" onClick={() => { setVerEspera(true) }}>
                  <Icon name="expandir" size={16} />
                  <span>{`Ver también los ${String(enEspera)} insumos que pueden esperar`}</span>
                </Button>
              ) : null}
            </div>
          )
        }}
      </ReportState>
    </div>
  )
}
