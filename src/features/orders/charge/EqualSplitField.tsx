import { formatCents } from '../../../services/format'
import QuantityStepper from '../QuantityStepper'

interface EqualSplitFieldProps {
  /** Cuántas personas faltan pagar, contando a la que paga ahora. */
  readonly remaining: number
  readonly partCents: number
  readonly onChange: (remaining: number) => void
}

const MAX_PERSONAS = 20

/** Entre cuántas personas se divide lo que falta, y cuánto paga cada una. */
export default function EqualSplitField({ remaining, partCents, onChange }: EqualSplitFieldProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Faltan pagar</span>
        <QuantityStepper
          name="personas"
          quantity={remaining}
          max={MAX_PERSONAS}
          canRemove={false}
          onChange={onChange}
        />
      </div>
      <p className="m-0 text-right">
        <span className="block text-xs text-muted-foreground">
          {remaining === 1 ? 'Paga lo que falta' : 'Paga cada una'}
        </span>
        <span className="text-xl font-bold tabular-nums">{formatCents(partCents)}</span>
      </p>
    </div>
  )
}
