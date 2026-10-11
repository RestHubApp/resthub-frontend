import { useCallback, useState } from 'react'

import { PERMISSION } from '@/api/permissions'
import { PageHeader } from '@/components/PageHeader'
import { useCan } from '@/store/session'
import { InventoryPanels } from './InventoryPanels'
import { LowStockSummary } from './LowStockSummary'
import { NewIngredientButton } from './NewIngredientButton'
import { StockActionDialog, type StockAction } from './StockActionDialog'
import { StockRulesCard } from './StockRulesCard'
import { useInventorySection } from './useInventorySection'

/**
 * El inventario: insumos, su libro, las alertas y las recetas.
 *
 * La pestaña abierta vive en la dirección (`?vista=recetas`): volver desde el
 * editor de una receta deja a la persona donde estaba, y un enlace puede
 * llevar directo a las alertas.
 */
export function InventoryView() {
  const canManage = useCan(PERMISSION.inventoryManage)
  const [section, setSection] = useInventorySection()
  const [action, setAction] = useState<StockAction | null>(null)
  const open = useCallback((fresh: StockAction) => {
    setAction(fresh)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventario"
        description="El stock sale del libro de movimientos: compras, mermas, ajustes y lo que consumen los pedidos servidos."
        actions={
          canManage ? (
            <NewIngredientButton
              onClick={() => {
                open({ kind: 'create' })
              }}
            />
          ) : undefined
        }
      />
      {canManage ? <StockRulesCard /> : null}
      <LowStockSummary
        onShowAlerts={() => {
          setSection('alertas')
        }}
      />
      <InventoryPanels section={section} onSectionChange={setSection} canManage={canManage} onAction={open} />
      <StockActionDialog
        action={action}
        onClose={() => {
          setAction(null)
        }}
      />
    </div>
  )
}
