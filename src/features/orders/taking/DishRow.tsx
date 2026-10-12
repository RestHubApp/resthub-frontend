import type { OrderMenuItem } from '@/api/types'
import { DishRowButton } from './DishRowButton'
import { DishRowControl } from './DishRowControl'

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

/** Por qué no se puede pedir: agotado a mano o sin insumos según la receta. */
function unavailableLabel(item: OrderMenuItem): string | null {
  if (!item.is_available) {
    return 'Agotado'
  }
  return item.out_of_stock ? 'Sin insumos' : null
}

/**
 * Un plato de la carta: tocarlo suma uno.
 *
 * El renglon entero es el boton, porque es lo que el pulgar busca. Cuando el
 * plato ya esta en el pedido aparecen al costado el menos y el mas. Un plato
 * agotado se ve, para que el mesero pueda avisarle al cliente, pero no se
 * puede elegir.
 */
export function DishRow({ item, quantity, onAdd, onChange }: DishRowProps) {
  const reason = unavailableLabel(item)

  return (
    <li className={`flex items-center gap-2 rounded-xl pr-2 ring-1 ${rowTone(quantity > 0, reason !== null)}`}>
      <DishRowButton
        name={item.name}
        price={item.price}
        hasOptions={item.modifier_groups.length > 0}
        reason={reason}
        isSelected={quantity > 0}
        onAdd={onAdd}
      />
      <DishRowControl name={item.name} quantity={quantity} hasOptions={item.modifier_groups.length > 0} onChange={onChange} />
    </li>
  )
}
