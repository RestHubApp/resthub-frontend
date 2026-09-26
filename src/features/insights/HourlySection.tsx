import { fetchHourlySales, insightsReportQuery } from '../../api/insights'
import type { HourlyCell, InsightsRangeParams } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import ChartCard from './charts/ChartCard'
import DataGrid from './charts/DataGrid'
import Heatmap from './charts/Heatmap'
import ReportState from './ReportState'
import { useInsightsReport } from './useInsightsReport'
import { formatHourOfDay, formatInteger, formatMoney } from '../../services/format'

interface HourlySectionProps {
  readonly range: InsightsRangeParams
}

function franja(cell: HourlyCell): string {
  return `${formatHourOfDay(cell.hour)} a ${formatHourOfDay(cell.hour + 1)}`
}

const COLUMNS = [
  { header: 'Día', cell: (cell: HourlyCell) => cell.weekday_label },
  { header: 'Hora', cell: franja },
  { header: 'Pedidos pagados', cell: (cell: HourlyCell) => formatInteger(cell.paid_orders), numeric: true },
  { header: 'Ventas', cell: (cell: HourlyCell) => formatMoney(cell.sales), numeric: true },
  { header: 'Promedio por día', cell: (cell: HourlyCell) => formatMoney(cell.average_sales), numeric: true },
]

function describe(cell: HourlyCell) {
  return {
    title: `${cell.weekday_label}, ${franja(cell)}`,
    rows: [
      { label: 'pedidos pagados', value: formatInteger(cell.paid_orders) },
      { label: 'vendido', value: formatMoney(cell.sales) },
      { label: 'promedio por día', value: formatMoney(cell.average_sales) },
    ],
  }
}

/** Cuándo se llena el local: día de la semana por hora, con la hora pico escrita. */
export default function HourlySection({ range }: HourlySectionProps) {
  const report = useInsightsReport(insightsReportQuery('sales-hourly', range, fetchHourlySales))

  return (
    <ReportState data={report.data} error={report.error} errorText="No se pudo cargar el mapa por hora.">
      {({ cells, peak }) => (
        <ChartCard
          title="Pedidos por día y hora"
          description={
            peak === null ? (
              'Pedidos pagados en cada franja de una hora, en la hora del restaurante.'
            ) : (
              <>
                Hora pico: <strong className="font-semibold text-foreground">{`${peak.weekday_label.toLowerCase()} de ${franja(peak)}`}</strong>,{' '}
                {formatInteger(peak.paid_orders)} pedidos ({formatMoney(peak.sales)}). Marcada con un anillo.
              </>
            )
          }
          refreshing={report.refreshing}
          chart={
            peak === null ? (
              <EmptyState title="No hubo pedidos pagados en este rango." />
            ) : (
              <Heatmap
                cells={cells}
                peak={peak}
                label="Mapa de calor de pedidos pagados por día de la semana y hora. Usa las flechas para recorrerlo."
                describe={describe}
              />
            )
          }
          table={
            <DataGrid
              caption="Pedidos pagados por día y hora"
              columns={COLUMNS}
              rows={cells.filter((cell) => cell.paid_orders > 0)}
              rowKey={(cell) => `${String(cell.weekday)}-${String(cell.hour)}`}
            />
          }
        />
      )}
    </ReportState>
  )
}
