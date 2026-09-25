import type { OrderMenuItem } from '../../../api/types'
import Icon from '../../../components/Icon'
import { formatMoney } from '../format'
import QuantityStepper from '../QuantityStepper'
import { MAX_QUANTITY } from './useOrderDraft'

function rowTone(elegido: boolean, agotado: boolean): string {
  if (agotado) {
    return 'bg-muted/60 ring-foreground/5'
  }
  return elegido ? 'bg-secondary ring-primary/40' : 'bg-card ring-foreground/10'
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
export default function DishRow({ item, quantity, onAdd, onChange }: DishRowProps) {
  const agotado = !item.is_available
  const elegido = quantity > 0

  return (
    <li
      className={`flex items-center gap-2 rounded-xl pr-2 ring-1 ${rowTone(elegido, agotado)}`}
    >
      <button
        type="button"
        disabled={agotado}
        onClick={onAdd}
        className="flex min-h-16 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`font-medium ${agotado ? 'text-muted-foreground line-through decoration-1' : ''}`}>{item.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{formatMoney(item.price)}</span>
        </span>
        {agotado ? (
          <span className="rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-semibold text-background">
            Agotado
          </span>
        ) : null}
        {!agotado && !elegido ? (
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-primary/25">
            <Icon name="agregar" size={18} label="Agregar" />
          </span>
        ) : null}
      </button>
      {elegido ? (
        <QuantityStepper name={item.name} quantity={quantity} max={MAX_QUANTITY} onChange={onChange} />
      ) : null}
    </li>
  )
}
