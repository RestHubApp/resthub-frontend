import { fetchWasteReport, insightsReportQuery } from '../../api/insights'
import type { InsightsRangeParams, WasteByIngredient } from '../../api/types'
import ChartCard from './charts/ChartCard'
import DataGrid from './charts/DataGrid'
import ClassifyWasteButton from './ClassifyWasteButton'
import ReportState from './ReportState'
import { WASTE_REPORT } from './useClassifyWaste'
import { useInsightsReport } from './useInsightsReport'
import WasteCharts from './WasteCharts'
import { formatInteger, formatMoney, formatQuantity } from '../../services/format'

interface WasteSectionProps {
  readonly range: InsightsRangeParams
}

const COLUMNS = [
  { header: 'Insumo', cell: (row: WasteByIngredient) => row.name },
  { header: 'Mermas', cell: (row: WasteByIngredient) => formatInteger(row.events), numeric: true },
  { header: 'Cantidad', cell: (row: WasteByIngredient) => formatQuantity(row.quantity, row.unit), numeric: true },
  { header: 'Costo', cell: (row: WasteByIngredient) => formatMoney(row.cost), numeric: true },
]

/** Lo que se perdió, por qué y en qué insumos. La causa la clasifica la IA. */
export default function WasteSection({ range }: WasteSectionProps) {
  const report = useInsightsReport(insightsReportQuery(WASTE_REPORT, range, fetchWasteReport))

  return (
    <ReportState data={report.data} error={report.error} errorText="No se pudieron cargar las mermas.">
      {(data) => (
        <ChartCard
          title="Mermas"
          description={`${formatInteger(data.events)} mermas por ${formatMoney(data.total_cost)}. La IA lee el motivo escrito y lo clasifica; tú decides qué hacer.`}
          refreshing={report.refreshing}
          actions={<ClassifyWasteButton pending={data.pending_classification} />}
          chart={<WasteCharts report={data} />}
          table={
            <div className="flex flex-col gap-4">
              <DataGrid
                caption="Mermas por causa"
                columns={[
                  { header: 'Causa', cell: (row) => row.label },
                  { header: 'Mermas', cell: (row) => formatInteger(row.events), numeric: true },
                  { header: 'Costo', cell: (row) => formatMoney(row.cost), numeric: true },
                ]}
                rows={data.by_cause}
                rowKey={(row) => row.cause ?? 'pendiente'}
              />
              <DataGrid caption="Mermas por insumo" columns={COLUMNS} rows={data.by_ingredient} rowKey={(row) => String(row.ingredient_id)} />
            </div>
          }
        />
      )}
    </ReportState>
  )
}
