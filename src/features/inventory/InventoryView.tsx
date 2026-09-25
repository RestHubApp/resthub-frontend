import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'

import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button } from '../../components/ui/button'
import { useCan } from '../../store/session'
import AlertsPanel from './AlertsPanel'
import IngredientsPanel from './IngredientsPanel'
import { type InventorySection, SECTIONS } from './inventorySections'
import InventoryTabs from './InventoryTabs'
import LowStockSummary from './LowStockSummary'
import MovementsPanel from './MovementsPanel'
import RecipesPanel from './RecipesPanel'
import StockActionDialog, { type StockAction } from './StockActionDialog'
import { useLowStock } from './useLowStock'

function seccionDe(valor: string | null): InventorySection {
  return SECTIONS.find((seccion) => seccion.value === valor)?.value ?? 'insumos'
}

/**
 * El inventario: insumos, su libro, las alertas y las recetas.
 *
 * La pestaña abierta vive en la dirección (`?vista=recetas`): volver desde el
 * editor de una receta deja a la persona donde estaba, y un enlace puede
 * llevar directo a las alertas.
 */
export default function InventoryView() {
  const canManage = useCan('inventory.manage')
  const [params, setParams] = useSearchParams()
  const seccion = seccionDe(params.get('vista'))
  const alertas = useLowStock()
  const [accion, setAccion] = useState<StockAction | null>(null)
  const abrir = useCallback((nueva: StockAction) => {
    setAccion(nueva)
  }, [])
  const irA = (nueva: InventorySection) => {
    setParams(nueva === 'insumos' ? {} : { vista: nueva }, { replace: true })
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
                abrir({ kind: 'create' })
              }}
            >
              <Icon name="agregar" size={16} />
              <span>Nuevo insumo</span>
            </Button>
          ) : undefined
        }
      />
      <LowStockSummary
        onShowAlerts={() => {
          irA('alertas')
        }}
      />
      <InventoryTabs
        value={seccion}
        onChange={irA}
        alertCount={alertas.data?.length}
        panels={{
          insumos: <IngredientsPanel canManage={canManage} onAction={abrir} />,
          movimientos: <MovementsPanel />,
          alertas: <AlertsPanel canManage={canManage} onAction={abrir} />,
          recetas: <RecipesPanel canManage={canManage} />,
        }}
      />
      <StockActionDialog
        action={accion}
        onClose={() => {
          setAccion(null)
        }}
      />
    </div>
  )
}
