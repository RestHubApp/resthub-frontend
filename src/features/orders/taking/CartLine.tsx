import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuantityStepper } from '@/features/orders/QuantityStepper'
import { MAX_QUANTITY } from '@/features/orders/quantityLimit'
import type { DraftLine } from './useOrderDraft'
import { formatCents, toCents } from '@/services/format'

interface CartLineProps {
  readonly line: DraftLine
  readonly onQuantity: (quantity: number) => void
  readonly onNotes: (notes: string) => void
}

// El mismo tope que el servidor.
const MAX_NOTE = 200

/** Un plato del borrador: cantidad, subtotal y la nota para la cocina. */
export function CartLine({ line, onQuantity, onNotes }: CartLineProps) {
  const noteId = `nota-${line.lineKey.replaceAll(/[^\w-]/gu, '-')}`

  return (
    <li className="flex flex-col gap-2 border-b pb-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium">{line.name}</span>
          {line.modifiers.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {line.modifiers.map((modifier) => modifier.option).join(' · ')}
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatCents(toCents(line.unitPrice) * line.quantity)}
          </span>
        </div>
        <QuantityStepper name={line.name} quantity={line.quantity} max={MAX_QUANTITY} onChange={onQuantity} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={noteId} className="text-sm text-muted-foreground">
          Nota para cocina
        </Label>
        <Input
          id={noteId}
          className="h-11 text-base"
          placeholder="Sin cebolla, alergia al maní…"
          maxLength={MAX_NOTE}
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
