import { Icon } from '@/components/Icon'
import { formatMoney } from '@/services/format'

interface DishRowButtonProps {
  readonly name: string
  readonly price: string
  /** Si el plato tiene opciones, el precio lo avisa. */
  readonly hasOptions: boolean
  /** Por que no se puede pedir; `null` si esta disponible. */
  readonly reason: string | null
  readonly isSelected: boolean
  readonly onAdd: () => void
}

/** El renglon entero como boton: nombre, precio y la etiqueta o el "+" del costado. */
export function DishRowButton({ name, price, hasOptions, reason, isSelected, onAdd }: DishRowButtonProps) {
  const isOutOfStock = reason !== null

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={onAdd}
      className="flex min-h-16 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`font-medium ${isOutOfStock ? 'text-muted-foreground line-through decoration-1' : ''}`}>{name}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatMoney(price)}
          {hasOptions ? ' · con opciones' : ''}
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
  )
}
