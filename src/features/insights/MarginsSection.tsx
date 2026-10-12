import { fetchDishMargins, insightsReportQuery } from '@/api/insights'
import type { InsightsRangeParams } from '@/api/types'
import { SectionCard } from '@/components/SectionCard'
import { MarginsBody } from './MarginsBody'
import { ReportState } from './ReportState'
import { useInsightsReport } from './useInsightsReport'

interface MarginsSectionProps {
  readonly range: InsightsRangeParams
}

/**
 * Cuánto deja cada plato: precio menos receta, y la ganancia bruta del período.
 *
 * En la pantalla se ven los cinco mejores y los cinco peores; la tabla con
 * todos los platos se abre en una hoja.
 */
export function MarginsSection({ range }: MarginsSectionProps) {
  const report = useInsightsReport(insightsReportQuery('dishes-margins', range, fetchDishMargins))
  const withoutRecipe = report.data?.dishes.filter((dish) => dish.recipe_cost === null).length ?? 0

  return (
    <SectionCard
      title="Margen por plato"
      description={
        withoutRecipe > 0
          ? `El costo sale de la receta. ${String(withoutRecipe)} platos no tienen receta: su margen no se puede calcular.`
          : 'El costo sale de la receta de cada plato y del costo actual de sus insumos.'
      }
    >
      <div className={`transition-opacity ${report.refreshing ? 'opacity-50' : ''}`}>
        <ReportState data={report.data} error={report.error} errorText="No se pudo cargar el margen por plato." loadingLabel="Cargando el margen por plato…">
          {({ dishes }) => <MarginsBody dishes={dishes} />}
        </ReportState>
      </div>
    </SectionCard>
  )
}
