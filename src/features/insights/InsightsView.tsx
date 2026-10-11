import { salesSummaryQuery } from '@/api/insights'
import { ListSkeleton } from '@/components/ListSkeleton'
import { InsightsSectionGrid } from './InsightsSectionGrid'
import { KpiRow } from './KpiRow'
import { PanelHeader } from './PanelHeader'
import { RangeFilter } from './RangeFilter'
import { ReportState } from './ReportState'
import { useInsightsRange } from './useInsightsRange'
import { useInsightsReport } from './useInsightsReport'
import { useTimeZone } from '@/store/session'

const KPI_LOADING = (
  <ListSkeleton
    label="Cargando el resumen…"
    count={4}
    className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    itemClassName="h-28 rounded-xl"
  />
)

/**
 * El panel del encargado: cómo va el negocio en el período elegido.
 *
 * El filtro de fechas va una vez, arriba, y acota cada sección de abajo, así
 * los números de todas las tarjetas coinciden entre sí.
 */
export function InsightsView() {
  const zone = useTimeZone()
  const range = useInsightsRange(zone)
  const summary = useInsightsReport(salesSummaryQuery(range.params))
  const period = summary.data?.period

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader description="Ventas, platos, márgenes y mermas del período. Los montos son de pedidos cobrados." />
      <RangeFilter range={range} period={period} timeZone={zone} />
      <div className={`transition-opacity ${summary.refreshing ? 'opacity-50' : ''}`}>
        <ReportState data={summary.data} error={summary.error} errorText="No se pudo cargar el resumen del período." skeleton={KPI_LOADING}>
          {(data) => <KpiRow summary={data} />}
        </ReportState>
      </div>
      <InsightsSectionGrid range={range.params} />
    </div>
  )
}
