import type { PurchaseOrder } from '@/api/types'
import { Input } from '@/components/ui/input'
import { formatQuantity } from '@/services/format'

interface ReceiveLineRowProps {
  readonly line: PurchaseOrder['lines'][number]
  /** Lo escrito: cantidad recibida y costo real por unidad. */
  readonly quantity: string
  readonly unitCost: string
  readonly onQuantity: (value: string) => void
  readonly onUnitCost: (value: string) => void
}

/** Un insumo de la orden que llegó: lo pedido, y dos campos para lo recibido y su costo real. */
export function ReceiveLineRow({ line, quantity, unitCost, onQuantity, onUnitCost }: ReceiveLineRowProps) {
  return (
    <li className="grid grid-cols-[1fr_7rem_7rem] items-center gap-2 text-sm">
      <span>
        {line.ingredient_name}
        <span className="block text-xs text-muted-foreground">Pedido: {formatQuantity(line.quantity, line.unit ?? '')}</span>
      </span>
      <Input
        aria-label={`Cantidad recibida de ${line.ingredient_name}`}
        inputMode="decimal"
        value={quantity}
        onChange={(event) => {
          onQuantity(event.target.value)
        }}
      />
      <Input
        aria-label={`Costo real por unidad de ${line.ingredient_name}`}
        inputMode="decimal"
        value={unitCost}
        onChange={(event) => {
          onUnitCost(event.target.value)
        }}
      />
    </li>
  )
}
