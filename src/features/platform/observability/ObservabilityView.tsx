import { PageHeader } from '@/components/PageHeader'
import { useHashFocus } from '@/hooks/useHashFocus'
import { DeferredPanels } from './DeferredPanels'
import { LatencySection } from './LatencySection'
import { windowParams } from './obsFilters'
import { ObsToolbar } from './ObsToolbar'
import { SecurityAlertsSection } from './SecurityAlertsSection'
import { StatusSection } from './StatusSection'
import { SummarySection } from './SummarySection'
import { TrafficSection } from './TrafficSection'
import { useObsFilters } from './useObsFilters'
import { useObsRefresh } from './useObsRefresh'

/**
 * Cómo anda la aplicación: tráfico, errores, latencias, rutas y logs de la
 * ventana elegida, con lo que el backend guarda de sí mismo, y las alertas de
 * seguridad por picos.
 *
 * Se relee cada 30 s mientras la pestaña está a la vista; los filtros van en
 * la dirección, así un enlace lleva al mismo panel.
 */
export function ObservabilityView() {
  const { filters, update } = useObsFilters()
  const refresh = useObsRefresh()
  const { live } = refresh
  const params = windowParams(filters)
  useHashFocus()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Observabilidad"
        description="Tráfico, errores, latencias y logs de la aplicación. Horas de Lima."
      />
      <ObsToolbar filters={filters} onChange={update} refresh={refresh} />
      <SummarySection params={params} live={live} />
      <SecurityAlertsSection live={live} />
      <TrafficSection params={params} live={live} />
      <div className="grid gap-6 lg:grid-cols-2">
        <LatencySection params={params} live={live} />
        <StatusSection params={params} live={live} />
      </div>
      <DeferredPanels filters={filters} onChange={update} live={live} />
    </div>
  )
}
