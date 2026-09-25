import type { UseFormRegisterReturn } from 'react-hook-form'

import TextField from '../../../components/TextField'
import { Button } from '../../../components/ui/button'
import { centsToApi, formatCents } from '../../../services/format'

interface CashAmountFieldProps {
  readonly field: UseFormRegisterReturn
  readonly error?: string
  readonly totalCents: number
  /** El vuelto calculado con lo escrito, o `null` si todavia no se puede calcular. */
  readonly changeCents: number | null
  readonly onQuick: (amount: string) => void
}

const BILLETES = [50, 100, 200] as const
const CENTS = 100

/**
 * Cuanto entrego el cliente, con atajos para los billetes de siempre, y el vuelto en vivo.
 *
 * El vuelto se anuncia al cambiar: quien cobra mira el billete y la mano del
 * cliente, no la pantalla.
 */
export default function CashAmountField({
  field,
  error,
  totalCents,
  changeCents,
  onQuick,
}: CashAmountFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <TextField
        id="monto-recibido"
        label="Monto recibido"
        icon="pago"
        inputMode="decimal"
        autoComplete="off"
        placeholder={centsToApi(totalCents)}
        hint="Vacío se cobra el monto exacto."
        field={field}
        error={error}
      />
      <div role="group" aria-label="Montos rápidos" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button type="button" variant="outline" className="h-11" onClick={() => {
          onQuick(centsToApi(totalCents))
        }}>
          Monto exacto
        </Button>
        {BILLETES.map((billete) => (
          <Button
            key={billete}
            type="button"
            variant="outline"
            className="h-11"
            disabled={billete * CENTS < totalCents}
            onClick={() => {
              onQuick(String(billete))
            }}
          >
            {formatCents(billete * CENTS)}
          </Button>
        ))}
      </div>
      <p
        aria-live="polite"
        className="m-0 flex items-baseline justify-between rounded-lg bg-muted px-4 py-3"
      >
        <span className="font-medium">Vuelto</span>
        <span className="text-2xl font-bold tabular-nums">
          {changeCents === null ? '—' : formatCents(changeCents)}
        </span>
      </p>
    </div>
  )
}
