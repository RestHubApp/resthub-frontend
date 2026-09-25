import { fetchPaymentMix } from '../../api/insights'
import type { InsightsRangeParams, PaymentShare } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import BarList from './charts/BarList'
import ChartCard from './charts/ChartCard'
import DataGrid from './charts/DataGrid'
import ReportState from './ReportState'
import { useInsightsReport } from './useInsightsReport'
import { formatInteger, formatMoney, formatPercent, toNumber } from '../../services/format'

interface PaymentsSectionProps {
  readonly range: InsightsRangeParams
}

const COLUMNS = [
  { header: 'Medio de pago', cell: (row: PaymentShare) => row.label },
  { header: 'Pedidos', cell: (row: PaymentShare) => formatInteger(row.paid_orders), numeric: true },
  { header: 'Monto', cell: (row: PaymentShare) => formatMoney(row.amount), numeric: true },
  { header: 'Participación', cell: (row: PaymentShare) => formatPercent(row.share_percent), numeric: true },
]

/**
 * Ingresos por medio de pago. Barras y no torta: Yape y efectivo suelen estar
 * cerca, y una torta no deja comparar ángulos parecidos.
 */
export default function PaymentsSection({ range }: PaymentsSectionProps) {
  const report = useInsightsReport('payments', range, fetchPaymentMix)

  return (
    <ReportState data={report.data} error={report.error} errorText="No se pudieron cargar los medios de pago.">
      {({ methods, total }) => (
        <ChartCard
          title="Ingresos por medio de pago"
          description={`Total cobrado: ${formatMoney(total)}.`}
          refreshing={report.refreshing}
          chart={
            methods.length === 0 ? (
              <EmptyState title="No hubo cobros en este rango." />
            ) : (
              <BarList
                label="Ingresos por medio de pago"
                data={methods.map((row) => ({
                  key: row.method,
                  label: row.label,
                  value: toNumber(row.amount),
                  valueLabel: formatMoney(row.amount),
                  details: [
                    { label: 'cobrado', value: formatMoney(row.amount) },
                    { label: 'del total', value: formatPercent(row.share_percent) },
                    { label: 'pedidos', value: formatInteger(row.paid_orders) },
                  ],
                }))}
              />
            )
          }
          table={<DataGrid caption="Ingresos por medio de pago" columns={COLUMNS} rows={methods} rowKey={(row) => row.method} />}
        />
      )}
    </ReportState>
  )
}
