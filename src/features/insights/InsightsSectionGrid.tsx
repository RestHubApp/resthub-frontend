import type { InsightsRangeParams } from '@/api/types'
import { HourlySection } from './HourlySection'
import { LowStockSection } from './LowStockSection'
import { MarginsSection } from './MarginsSection'
import { PaymentsSection } from './PaymentsSection'
import { SalesTrendSection } from './SalesTrendSection'
import { TopDishesSection } from './TopDishesSection'
import { WaitersSection } from './WaitersSection'
import { WasteSection } from './WasteSection'

interface InsightsSectionGridProps {
  /** El período que acota cada sección. */
  readonly range: InsightsRangeParams
}

/** Las secciones del panel bajo el resumen, todas acotadas por el mismo período. */
export function InsightsSectionGrid({ range }: InsightsSectionGridProps) {
  return (
    <>
      <SalesTrendSection range={range} />
      <HourlySection range={range} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TopDishesSection range={range} />
        <PaymentsSection range={range} />
      </div>
      <MarginsSection range={range} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <WaitersSection range={range} />
        </div>
        <LowStockSection />
      </div>
      <WasteSection range={range} />
    </>
  )
}
