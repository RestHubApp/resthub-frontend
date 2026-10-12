import { DetailSheet } from '@/components/DetailSheet'
import { StockRulesCard } from './StockRulesCard'

interface StockRulesSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Las reglas que el inventario aplica a la carta, en una hoja aparte: se cambian pocas veces. */
export function StockRulesSheet({ open, onOpenChange }: StockRulesSheetProps) {
  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Reglas de stock"
      description="Cómo reacciona la carta cuando falta un insumo. El cambio se guarda al marcarlo."
    >
      <StockRulesCard />
    </DetailSheet>
  )
}
