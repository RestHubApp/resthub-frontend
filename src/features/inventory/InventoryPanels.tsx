import { AlertsPanel } from './AlertsPanel'
import { IngredientsPanel } from './IngredientsPanel'
import type { InventorySection } from './inventorySections'
import { InventoryTabs } from './InventoryTabs'
import { MovementsPanel } from './MovementsPanel'
import { PurchaseOrdersPanel } from './PurchaseOrdersPanel'
import { RecipesPanel } from './RecipesPanel'
import type { StockAction } from './StockActionDialog'
import { SuppliersPanel } from './SuppliersPanel'
import { useLowStock } from './useLowStock'

interface InventoryPanelsProps {
  readonly section: InventorySection
  readonly onSectionChange: (section: InventorySection) => void
  readonly canManage: boolean
  readonly onAction: (action: StockAction) => void
}

/** Las pestañas del inventario con el panel de cada sección. */
export function InventoryPanels({ section, onSectionChange, canManage, onAction }: InventoryPanelsProps) {
  const alerts = useLowStock()

  return (
    <InventoryTabs
      value={section}
      onChange={onSectionChange}
      alertCount={alerts.data?.length}
      panels={{
        'insumos': <IngredientsPanel canManage={canManage} onAction={onAction} />,
        'movimientos': <MovementsPanel />,
        'alertas': <AlertsPanel canManage={canManage} onAction={onAction} />,
        'recetas': <RecipesPanel canManage={canManage} />,
        'compras': <PurchaseOrdersPanel canManage={canManage} />,
        'proveedores': <SuppliersPanel canManage={canManage} />,
      }}
    />
  )
}
