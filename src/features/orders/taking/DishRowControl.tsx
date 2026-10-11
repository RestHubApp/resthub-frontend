import { QuantityStepper } from '@/features/orders/QuantityStepper'
import { MAX_QUANTITY } from '@/features/orders/quantityLimit'

interface DishRowControlProps {
  readonly name: string
  readonly quantity: number
  /** Un plato con opciones se ajusta en el resumen: cada combinación es una línea. */
  readonly hasOptions: boolean
  readonly onChange: (quantity: number) => void
}

/** Lo que va al costado de un plato ya elegido: el menos y el mas, o solo la cantidad si tiene opciones. */
export function DishRowControl({ name, quantity, hasOptions, onChange }: DishRowControlProps) {
  if (quantity <= 0) {
    return null
  }
  if (hasOptions) {
    return (
      <span className="rounded-full bg-primary px-2.5 py-1 text-sm font-semibold text-primary-foreground tabular-nums">
        ×{quantity}
      </span>
    )
  }
  return <QuantityStepper name={name} quantity={quantity} max={MAX_QUANTITY} onChange={onChange} />
}
