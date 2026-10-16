import { PERMISSION } from '@/api/permissions'
import { DetailSheet } from '@/components/DetailSheet'
import { useCan } from '@/store/session'
import { StockRulesCard } from './StockRulesCard'
import { WasteThresholdForm } from './WasteThresholdForm'

interface StockRulesSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Las reglas del inventario (la carta sin insumos y las mermas grandes), en una hoja aparte: se cambian pocas veces. */
export function StockRulesSheet({ open, onOpenChange }: StockRulesSheetProps) {
  // El monto de aprobación es un ajuste del local: lo cambia quien edita el restaurante.
  const canManageRestaurant = useCan(PERMISSION.restaurantManage)
  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Reglas de stock"
      description="Cómo reacciona la carta cuando falta un insumo y desde qué monto una merma pide aprobación."
    >
      <StockRulesCard />
      {canManageRestaurant ? <WasteThresholdForm /> : null}
    </DetailSheet>
  )
}
