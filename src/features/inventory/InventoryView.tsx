import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'

import { PERMISSION } from '@/api/permissions'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { AlertsPanel } from './AlertsPanel'
import { IngredientsPanel } from './IngredientsPanel'
import { type InventorySection, SECTIONS } from './inventorySections'
import { InventoryTabs } from './InventoryTabs'
import { LowStockSummary } from './LowStockSummary'
import { MovementsPanel } from './MovementsPanel'
import { PurchaseOrdersPanel } from './PurchaseOrdersPanel'
import { RecipesPanel } from './RecipesPanel'
import { StockRulesCard } from './StockRulesCard'
import { SuppliersPanel } from './SuppliersPanel'
import { StockActionDialog, type StockAction } from './StockActionDialog'
import { useLowStock } from './useLowStock'

function sectionOf(value: string | null): InventorySection {
  return SECTIONS.find((section) => section.value === value)?.value ?? 'insumos'
}

/**
 * El inventario: insumos, su libro, las alertas y las recetas.
 *
 * La pestaña abierta vive en la dirección (`?vista=recetas`): volver desde el
 * editor de una receta deja a la persona donde estaba, y un enlace puede
 * llevar directo a las alertas.
 */
export function InventoryView() {
  const canManage = useCan(PERMISSION.inventoryManage)
  const [params, setParams] = useSearchParams()
  const section = sectionOf(params.get('vista'))
  const alerts = useLowStock()
  const [action, setAction] = useState<StockAction | null>(null)
  const open = useCallback((fresh: StockAction) => {
    setAction(fresh)
  }, [])
  const irA = (fresh: InventorySection) => {
    setParams(fresh === 'insumos' ? {} : { 'vista': fresh }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventario"
        description="El stock sale del libro de movimientos: compras, mermas, ajustes y lo que consumen los pedidos servidos."
        actions={
          canManage ? (
            <Button
              type="button"
              size="lg"
              className="h-11 px-4"
              onClick={() => {
                open({ kind: 'create' })
              }}
            >
              <Icon name="add" size={16} />
              <span>Nuevo insumo</span>
            </Button>
          ) : undefined
        }
      />
      {canManage ? <StockRulesCard /> : null}
      <LowStockSummary
        onShowAlerts={() => {
          irA('alertas')
        }}
      />
      <InventoryTabs
        value={section}
        onChange={irA}
        alertCount={alerts.data?.length}
        panels={{
          'insumos': <IngredientsPanel canManage={canManage} onAction={open} />,
          'movimientos': <MovementsPanel />,
          'alertas': <AlertsPanel canManage={canManage} onAction={open} />,
          'recetas': <RecipesPanel canManage={canManage} />,
          'compras': <PurchaseOrdersPanel canManage={canManage} />,
          'proveedores': <SuppliersPanel canManage={canManage} />,
        }}
      />
      <StockActionDialog
        action={action}
        onClose={() => {
          setAction(null)
        }}
      />
    </div>
  )
}
