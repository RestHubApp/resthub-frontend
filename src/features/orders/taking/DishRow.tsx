import type { OrderMenuItem } from '@/api/types'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/features/orders/QuantityStepper'
import { MAX_QUANTITY } from './useOrderDraft'
import { formatMoney } from '@/services/format'

function rowTone(selected: boolean, outOfStock: boolean): string {
  if (outOfStock) {
    return 'bg-muted/60 ring-foreground/5'
  }
  return selected ? 'bg-secondary ring-primary/40' : 'bg-card ring-foreground/10'
}

interface DishRowProps {
  readonly item: OrderMenuItem
  readonly quantity: number
  readonly onAdd: () => void
  readonly onChange: (quantity: number) => void
}

/**
 * Un plato de la carta: tocarlo suma uno.
 *
 * El renglon entero es el boton, porque es lo que el pulgar busca. Cuando el
 * plato ya esta en el pedido aparecen al costado el menos y el mas. Un plato
 * agotado se ve, para que el mesero pueda avisarle al cliente, pero no se
 * puede elegir.
 */
/** Por qué no se puede pedir: agotado a mano o sin insumos según la receta. */
function unavailableLabel(item: OrderMenuItem): string | null {
  if (!item.is_available) {
    return 'Agotado'
  }
  return item.out_of_stock ? 'Sin insumos' : null
}

export function DishRow({ item, quantity, onAdd, onChange }: DishRowProps) {
  const reason = unavailableLabel(item)
  const isOutOfStock = reason !== null
  const isSelected = quantity > 0
  // Un plato con opciones se ajusta en el resumen: cada combinación es una línea.
  const hasOptions = item.modifier_groups.length > 0

  return (
    <li
      className={`flex items-center gap-2 rounded-xl pr-2 ring-1 ${rowTone(isSelected, isOutOfStock)}`}
    >
      <button
        type="button"
        disabled={isOutOfStock}
        onClick={onAdd}
        className="flex min-h-16 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`font-medium ${isOutOfStock ? 'text-muted-foreground line-through decoration-1' : ''}`}>{item.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatMoney(item.price)}
            {item.modifier_groups.length > 0 ? ' · con opciones' : ''}
          </span>
        </span>
        {isOutOfStock ? (
          <span className="rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-semibold text-background">
            {reason}
          </span>
        ) : null}
        {!isOutOfStock && !isSelected ? (
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-primary/25">
            <Icon name="add" size={18} label="Agregar" />
          </span>
        ) : null}
      </button>
      {isSelected && !hasOptions ? (
        <QuantityStepper name={item.name} quantity={quantity} max={MAX_QUANTITY} onChange={onChange} />
      ) : null}
      {isSelected && hasOptions ? (
        <span className="rounded-full bg-primary px-2.5 py-1 text-sm font-semibold text-primary-foreground tabular-nums">
          ×{quantity}
        </span>
      ) : null}
    </li>
  )
}
