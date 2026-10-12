import type { InsightsRangeParams } from '@/api/types'
import { InsightsTabs } from './InsightsTabs'
import { SalesTrendSection } from './SalesTrendSection'

interface InsightsSectionGridProps {
  /** El período que acota cada sección. */
  readonly range: InsightsRangeParams
}

/** Lo que sigue a los indicadores: las ventas por día a la vista y el resto del detalle en pestañas. */
export function InsightsSectionGrid({ range }: InsightsSectionGridProps) {
  return (
    <>
      <SalesTrendSection range={range} />
      <InsightsTabs range={range} />
    </>
  )
}
