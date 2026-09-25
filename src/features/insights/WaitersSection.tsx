import { fetchWaiterPerformance } from '../../api/insights'
import type { InsightsRangeParams, WaiterPerformance } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import SectionCard from '../../components/SectionCard'
import ReportState from './ReportState'
import { useInsightsReport } from './useInsightsReport'
import { formatInteger, formatMoney } from '../../services/format'

interface WaitersSectionProps {
  readonly range: InsightsRangeParams
}

const NUMERIC = 'text-right tabular-nums'

const COLUMNS: DataColumn<WaiterPerformance>[] = [
  { id: 'nombre', header: 'Mesero', cell: (row) => row.name },
  { id: 'pedidos', header: 'Pedidos', cell: (row) => formatInteger(row.paid_orders), className: NUMERIC },
  { id: 'ventas', header: 'Ventas', cell: (row) => formatMoney(row.sales), className: NUMERIC },
  { id: 'ticket', header: 'Ticket prom.', cell: (row) => formatMoney(row.average_ticket), className: NUMERIC },
  { id: 'cancelados', header: 'Cancelados', cell: (row) => formatInteger(row.cancelled_orders), className: NUMERIC },
]

/** Cuánto vendió cada mesero en el período, de mayor a menor. */
export default function WaitersSection({ range }: WaitersSectionProps) {
  const report = useInsightsReport('waiters', range, fetchWaiterPerformance)

  return (
    <SectionCard title="Rendimiento por mesero" description="Pedidos que tomó cada uno y se cobraron en el período.">
      <div className={`transition-opacity ${report.refreshing ? 'opacity-50' : ''}`}>
        <ReportState data={report.data} error={report.error} errorText="No se pudo cargar el rendimiento por mesero.">
          {({ waiters }) => (
            <DataTable
              columns={COLUMNS}
              data={waiters}
              isLoading={false}
              emptyMessage="Nadie cobró pedidos en este rango."
              getRowId={(row) => String(row.waiter_id)}
            />
          )}
        </ReportState>
      </div>
    </SectionCard>
  )
}
