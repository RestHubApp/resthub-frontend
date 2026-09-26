import { fetchDishMargins, insightsReportQuery } from '../../api/insights'
import type { InsightsRangeParams } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import SectionCard from '../../components/SectionCard'
import MarginsTable from './MarginsTable'
import ReportState from './ReportState'
import { useInsightsReport } from './useInsightsReport'

interface MarginsSectionProps {
  readonly range: InsightsRangeParams
}

/** Cuánto deja cada plato: precio menos receta, y la ganancia bruta del período. */
export default function MarginsSection({ range }: MarginsSectionProps) {
  const report = useInsightsReport(insightsReportQuery('dishes-margins', range, fetchDishMargins))
  const sinReceta = report.data?.dishes.filter((dish) => dish.recipe_cost === null).length ?? 0

  return (
    <SectionCard
      title="Margen por plato"
      description={
        sinReceta > 0
          ? `El costo sale de la receta. ${String(sinReceta)} platos no tienen receta: su margen no se puede calcular.`
          : 'El costo sale de la receta de cada plato y del costo actual de sus insumos.'
      }
    >
      <div className={`transition-opacity ${report.refreshing ? 'opacity-50' : ''}`}>
        <ReportState data={report.data} error={report.error} errorText="No se pudo cargar el margen por plato.">
          {({ dishes }) =>
            dishes.length === 0 ? <EmptyState title="No hay platos en la carta." /> : <MarginsTable dishes={dishes} />
          }
        </ReportState>
      </div>
    </SectionCard>
  )
}
