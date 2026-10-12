import type { UseFormRegisterReturn } from 'react-hook-form'

import { TextField } from '@/components/TextField'
import { centsToApi, formatCents } from '@/services/format'
import { QuickAmounts } from './QuickAmounts'

interface CashAmountFieldProps {
  readonly field: UseFormRegisterReturn
  readonly error?: string | undefined
  readonly totalCents: number
  /** El vuelto calculado con lo escrito, o `null` si todavia no se puede calcular. */
  readonly changeCents: number | null
  readonly onQuick: (amount: string) => void
}

/**
 * Cuanto entrego el cliente, con atajos para los billetes de siempre, y el vuelto en vivo.
 *
 * El vuelto se anuncia al cambiar: quien cobra mira el billete y la mano del
 * cliente, no la pantalla.
 */
export function CashAmountField({
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
        icon="payment"
        inputMode="decimal"
        autoComplete="off"
        placeholder={centsToApi(totalCents)}
        hint="Vacío se cobra el monto exacto."
        field={field}
        error={error}
      />
      <QuickAmounts totalCents={totalCents} onQuick={onQuick} />
      <p
        aria-live="polite"
        data-testid="cash-change"
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
