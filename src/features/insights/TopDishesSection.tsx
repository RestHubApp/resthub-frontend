import { fetchTopDishes } from '../../api/insights'
import type { InsightsRangeParams, TopDish } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import BarList from './charts/BarList'
import ChartCard from './charts/ChartCard'
import DataGrid from './charts/DataGrid'
import ReportState from './ReportState'
import { useInsightsReport } from './useInsightsReport'
import { formatInteger, formatMoney } from '../../services/format'

interface TopDishesSectionProps {
  readonly range: InsightsRangeParams
}

const COLUMNS = [
  { header: 'Plato', cell: (dish: TopDish) => dish.name },
  { header: 'Porciones', cell: (dish: TopDish) => formatInteger(dish.quantity), numeric: true },
  { header: 'Ingresos', cell: (dish: TopDish) => formatMoney(dish.revenue), numeric: true },
]

/** Los diez platos que más salieron, por porciones vendidas. */
export default function TopDishesSection({ range }: TopDishesSectionProps) {
  const report = useInsightsReport('dishes-top', range, fetchTopDishes)

  return (
    <ReportState data={report.data} error={report.error} errorText="No se pudieron cargar los platos más vendidos.">
      {({ dishes }) => (
        <ChartCard
          title="Platos más vendidos"
          description="Porciones vendidas en pedidos pagados."
          refreshing={report.refreshing}
          chart={
            dishes.length === 0 ? (
              <EmptyState title="No se vendieron platos en este rango." />
            ) : (
              <BarList
                label="Platos más vendidos por porciones"
                data={dishes.map((dish) => ({
                  key: String(dish.menu_item_id),
                  label: dish.name,
                  value: dish.quantity,
                  valueLabel: `${formatInteger(dish.quantity)} porc.`,
                  details: [
                    { label: 'porciones', value: formatInteger(dish.quantity) },
                    { label: 'ingresos', value: formatMoney(dish.revenue) },
                  ],
                }))}
              />
            )
          }
          table={
            <DataGrid caption="Platos más vendidos" columns={COLUMNS} rows={dishes} rowKey={(dish) => String(dish.menu_item_id)} />
          }
        />
      )}
    </ReportState>
  )
}
