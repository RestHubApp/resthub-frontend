import type { InsightsRangeParams } from '@/api/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HourlySection } from './HourlySection'
import { LowStockSection } from './LowStockSection'
import { MarginsSection } from './MarginsSection'
import { PaymentsSection } from './PaymentsSection'
import { TopDishesSection } from './TopDishesSection'
import { WaitersSection } from './WaitersSection'
import { WasteSection } from './WasteSection'

interface InsightsTabsProps {
  /** El período que acota cada sección. */
  readonly range: InsightsRangeParams
}

const TAB_CLASS = 'h-11 flex-none px-3.5'

/**
 * El detalle del panel en pestañas: platos, pagos y servicio, mermas y stock.
 *
 * Solo la pestaña abierta carga sus reportes. Lo del día (los indicadores y las
 * ventas por día) queda arriba, siempre a la vista.
 */
export function InsightsTabs({ range }: InsightsTabsProps) {
  return (
    <Tabs defaultValue="platos" className="gap-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="platos" className={TAB_CLASS}>Platos</TabsTrigger>
          <TabsTrigger value="pagos" className={TAB_CLASS}>Pagos y servicio</TabsTrigger>
          <TabsTrigger value="mermas" className={TAB_CLASS}>Mermas y stock</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="platos" className="flex flex-col gap-6">
        <TopDishesSection range={range} />
        <MarginsSection range={range} />
      </TabsContent>
      <TabsContent value="pagos" className="flex flex-col gap-6">
        <PaymentsSection range={range} />
        <HourlySection range={range} />
        <WaitersSection range={range} />
      </TabsContent>
      <TabsContent value="mermas" className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <WasteSection range={range} />
        </div>
        <LowStockSection />
      </TabsContent>
    </Tabs>
  )
}
