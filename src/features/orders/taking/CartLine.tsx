import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { formatCents, toCents } from '../format'
import QuantityStepper from '../QuantityStepper'
import { type DraftLine, MAX_QUANTITY } from './useOrderDraft'

interface CartLineProps {
  readonly line: DraftLine
  readonly onQuantity: (quantity: number) => void
  readonly onNotes: (notes: string) => void
}

// El mismo tope que el servidor.
const MAX_NOTA = 200

/** Un plato del borrador: cantidad, subtotal y la nota para la cocina. */
export default function CartLine({ line, onQuantity, onNotes }: CartLineProps) {
  const notaId = `nota-${String(line.menuItemId)}`

  return (
    <li className="flex flex-col gap-2 border-b pb-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium">{line.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatCents(toCents(line.unitPrice) * line.quantity)}
          </span>
        </div>
        <QuantityStepper name={line.name} quantity={line.quantity} max={MAX_QUANTITY} onChange={onQuantity} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={notaId} className="text-sm text-muted-foreground">
          Nota para cocina
        </Label>
        <Input
          id={notaId}
          className="h-11 text-base"
          placeholder="Sin cebolla, alergia al maní…"
          maxLength={MAX_NOTA}
          autoComplete="off"
          value={line.notes}
          onChange={(event) => {
            onNotes(event.target.value)
          }}
        />
      </div>
    </li>
  )
}
