import type { PurchaseOrder } from '@/api/types'
import { baseUnitLabel, fromBase } from './units'
import { UnitInput } from './UnitInput'

interface ReceiveLineRowProps {
  readonly line: PurchaseOrder['lines'][number]
  /** Lo escrito: cantidad recibida y costo real por unidad. */
  readonly quantity: string
  readonly unitCost: string
  readonly onQuantity: (value: string) => void
  readonly onUnitCost: (value: string) => void
}

/**
 * Un insumo de la orden que llegó: lo pedido, y dos campos para lo recibido y
 * su costo real. Todo en la unidad base del insumo (g, ml o unid.), la misma
 * de la orden, y a la vista: «Pedido: 5000 g», nunca «5 kg» junto a un 5000.
 */
export function ReceiveLineRow({ line, quantity, unitCost, onQuantity, onUnitCost }: ReceiveLineRowProps) {
  const unit = line.unit === null ? 'unid.' : baseUnitLabel(line.unit)
  return (
    <li className="grid grid-cols-[1fr_7rem_7rem] items-start gap-2 text-sm">
      <span>
        {line.ingredient_name}
        <span className="block text-xs text-muted-foreground">Pedido: {`${fromBase(line.quantity, 1)} ${unit}`}</span>
      </span>
      <UnitInput
        unit={unit}
        aria-label={`Cantidad recibida de ${line.ingredient_name}`}
        inputMode="decimal"
        value={quantity}
        onChange={(event) => {
          onQuantity(event.target.value)
        }}
      />
      <UnitInput
        unit={`S/ por ${unit}`}
        aria-label={`Costo real por ${unit} de ${line.ingredient_name}`}
        inputMode="decimal"
        value={unitCost}
        onChange={(event) => {
          onUnitCost(event.target.value)
        }}
      />
    </li>
  )
}
