import { useCallback, useState } from 'react'

import { PERMISSION } from '@/api/permissions'
import { PageHeader } from '@/components/PageHeader'
import { useScreenAction } from '@/hooks/useScreenAction'
import { useCan } from '@/store/session'
import { InventoryHeaderActions } from './InventoryHeaderActions'
import { InventoryPanels } from './InventoryPanels'
import { StockActionDialog, type StockAction } from './StockActionDialog'
import { StockRulesSheet } from './StockRulesSheet'
import { useInventorySection } from './useInventorySection'

/**
 * El inventario: insumos, su libro, recetas, compras y proveedores.
 *
 * La pestaña abierta vive en la dirección (`?vista=recetas`): volver desde el
 * editor de una receta deja a la persona donde estaba. Lo que hay que reponer
 * se ve en la pestaña de insumos, con el filtro «Solo bajo mínimo». Las reglas
 * de stock, que casi no se tocan, van en una hoja.
 */
export function InventoryView() {
  const canManage = useCan(PERMISSION.inventoryManage)
  const [section, setSection] = useInventorySection()
  const [action, setAction] = useState<StockAction | null>(null)
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const open = useCallback((fresh: StockAction) => {
    setAction(fresh)
  }, [])
  useScreenAction('reglas-de-stock', () => {
    if (canManage) {
      setIsRulesOpen(true)
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventario"
        description="Lo que tienes en cocina y cuándo reponerlo: compras, mermas, ajustes y lo que consumen los pedidos servidos."
        actions={
          canManage ? (
            <InventoryHeaderActions
              onRules={() => {
                setIsRulesOpen(true)
              }}
              onNewIngredient={() => {
                open({ kind: 'create' })
              }}
            />
          ) : undefined
        }
      />
      <InventoryPanels section={section} onSectionChange={setSection} canManage={canManage} onAction={open} />
      <StockActionDialog
        action={action}
        onClose={() => {
          setAction(null)
        }}
      />
      {canManage ? <StockRulesSheet open={isRulesOpen} onOpenChange={setIsRulesOpen} /> : null}
    </div>
  )
}
