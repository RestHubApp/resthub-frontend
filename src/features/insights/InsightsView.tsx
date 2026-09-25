import { useState } from 'react'

import { fetchSalesSummary } from '../../api/insights'
import { DEFAULT_TIME_ZONE } from './dateRange'
import HourlySection from './HourlySection'
import KpiRow from './KpiRow'
import LowStockSection from './LowStockSection'
import MarginsSection from './MarginsSection'
import PanelHeader from './PanelHeader'
import PaymentsSection from './PaymentsSection'
import RangeFilter from './RangeFilter'
import ReportState from './ReportState'
import SalesTrendSection from './SalesTrendSection'
import TopDishesSection from './TopDishesSection'
import { useInsightsRange } from './useInsightsRange'
import { useInsightsReport } from './useInsightsReport'
import WaitersSection from './WaitersSection'
import WasteSection from './WasteSection'

/**
 * El panel del encargado: cómo va el negocio en el período elegido.
 *
 * El filtro de fechas va una vez, arriba, y acota cada sección de abajo, así
 * los números de todas las tarjetas coinciden entre sí.
 */
export default function InsightsView() {
  const [zona, setZona] = useState(DEFAULT_TIME_ZONE)
  const range = useInsightsRange(zona)
  const summary = useInsightsReport('summary', range.params, fetchSalesSummary)
  const periodo = summary.data?.period

  // Los días son los del restaurante: si su zona no es la supuesta, se
  // recalcula "hoy" con la que informa el servidor.
  if (periodo !== undefined && periodo.timezone !== zona) {
    setZona(periodo.timezone)
  }

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader description="Ventas, platos, márgenes y mermas del período. Los montos son de pedidos cobrados." />
      <RangeFilter range={range} period={periodo} timeZone={zona} />
      <div className={`transition-opacity ${summary.refreshing ? 'opacity-50' : ''}`}>
        <ReportState data={summary.data} error={summary.error} errorText="No se pudo cargar el resumen del período.">
          {(data) => <KpiRow summary={data} />}
        </ReportState>
      </div>
      <SalesTrendSection range={range.params} />
      <HourlySection range={range.params} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TopDishesSection range={range.params} />
        <PaymentsSection range={range.params} />
      </div>
      <MarginsSection range={range.params} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <WaitersSection range={range.params} />
        </div>
        <LowStockSection />
      </div>
      <WasteSection range={range.params} />
    </div>
  )
}
