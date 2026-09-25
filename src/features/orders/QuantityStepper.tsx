import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'

interface QuantityStepperProps {
  /** El plato, para que cada boton diga de que plato quita o agrega. */
  readonly name: string
  readonly quantity: number
  readonly max: number
  readonly onChange: (quantity: number) => void
  readonly disabled?: boolean
  /** Con la cantidad en 1, "−" quita el plato. */
  readonly canRemove?: boolean
}

const BUTTON = 'size-11 rounded-full text-base'

/** Menos, cantidad y mas, con blancos de 44 px para el pulgar. */
export default function QuantityStepper({
  name,
  quantity,
  max,
  onChange,
  disabled = false,
  canRemove = true,
}: QuantityStepperProps) {
  const quitaPlato = quantity <= 1

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        className={BUTTON}
        aria-label={quitaPlato ? `Quitar ${name}` : `Uno menos de ${name}`}
        disabled={disabled || (quitaPlato && !canRemove)}
        onClick={() => {
          onChange(quantity - 1)
        }}
      >
        <Icon name={quitaPlato ? 'eliminar' : 'quitar'} size={18} />
      </Button>
      <span className="min-w-8 text-center text-lg font-bold tabular-nums">
        <span className="sr-only">Cantidad: </span>
        {quantity}
      </span>
      <Button
        type="button"
        variant="outline"
        className={BUTTON}
        aria-label={`Uno más de ${name}`}
        disabled={disabled || quantity >= max}
        onClick={() => {
          onChange(quantity + 1)
        }}
      >
        <Icon name="agregar" size={18} />
      </Button>
    </div>
  )
}
