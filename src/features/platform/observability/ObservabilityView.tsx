import { lazy, Suspense } from 'react'

import PageHeader from '../../../components/PageHeader'
import DeferredSection from './DeferredSection'
import LatencySection from './LatencySection'
import { windowParams } from './obsFilters'
import ObsToolbar from './ObsToolbar'
import StatusSection from './StatusSection'
import SummarySection from './SummarySection'
import TrafficSection from './TrafficSection'
import { useHashFocus } from './useHashFocus'
import { useObsFilters } from './useObsFilters'
import { useObsRefresh } from './useObsRefresh'

const RoutesSection = lazy(() => import('./RoutesSection'))
const LogsSection = lazy(() => import('./LogsSection'))
const RequestsSection = lazy(() => import('./RequestsSection'))

/**
 * Cómo anda la aplicación: tráfico, errores, latencias, rutas y logs de la
 * ventana elegida, con lo que el backend guarda de sí mismo.
 *
 * Se relee cada 30 s mientras la pestaña está a la vista; los filtros van en
 * la dirección, así un enlace lleva al mismo panel.
 */
export default function ObservabilityView() {
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
      <TrafficSection params={params} live={live} />
      <div className="grid gap-6 lg:grid-cols-2">
        <LatencySection params={params} live={live} />
        <StatusSection params={params} live={live} />
      </div>
      <DeferredSection name="Rutas del API">
        <Suspense fallback={<p role="status">Cargando las rutas…</p>}>
          <RoutesSection filters={filters} live={live} />
        </Suspense>
      </DeferredSection>
      <DeferredSection name="Logs" anchor="logs">
        <Suspense fallback={<p role="status">Cargando los logs…</p>}>
          <LogsSection filters={filters} onChange={update} live={live} />
        </Suspense>
      </DeferredSection>
      <DeferredSection name="Peticiones" anchor="peticiones">
        <Suspense fallback={<p role="status">Cargando las peticiones…</p>}>
          <RequestsSection filters={filters} onChange={update} live={live} />
        </Suspense>
      </DeferredSection>
    </div>
  )
}
