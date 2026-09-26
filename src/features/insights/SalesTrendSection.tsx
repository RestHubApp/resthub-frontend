import { fetchDailySales, insightsReportQuery } from '../../api/insights'
import type { DailySalesPoint, InsightsRangeParams } from '../../api/types'
import ChartCard from './charts/ChartCard'
import DataGrid from './charts/DataGrid'
import ReportState from './ReportState'
import SalesChart from './SalesChart'
import { useInsightsReport } from './useInsightsReport'
import { formatInteger, formatLongDate, formatMoney } from '../../services/format'

interface SalesTrendSectionProps {
  readonly range: InsightsRangeParams
}

const COLUMNS = [
  { header: 'Día', cell: (day: DailySalesPoint) => formatLongDate(day.date) },
  { header: 'Ventas', cell: (day: DailySalesPoint) => formatMoney(day.sales), numeric: true },
  { header: 'Pedidos pagados', cell: (day: DailySalesPoint) => formatInteger(day.paid_orders), numeric: true },
  { header: 'Ticket promedio', cell: (day: DailySalesPoint) => formatMoney(day.average_ticket), numeric: true },
]

/** Ventas por día: la tendencia del período. */
export default function SalesTrendSection({ range }: SalesTrendSectionProps) {
  const report = useInsightsReport(insightsReportQuery('sales-daily', range, fetchDailySales))

  return (
    <ReportState data={report.data} error={report.error} errorText="No se pudieron cargar las ventas por día.">
      {(data) => (
        <ChartCard
          title="Ventas por día"
          description="Lo cobrado cada día, en soles. Los días sin ventas cuentan como cero."
          refreshing={report.refreshing}
          chart={<SalesChart days={data.days} />}
          table={<DataGrid caption="Ventas por día" columns={COLUMNS} rows={data.days} rowKey={(day) => day.date} />}
        />
      )}
    </ReportState>
  )
}
