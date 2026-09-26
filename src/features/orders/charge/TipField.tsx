import type { UseFormRegisterReturn } from 'react-hook-form'

import TextField from '../../../components/TextField'
import { Button } from '../../../components/ui/button'
import { formatCents } from '../../../services/format'

interface TipFieldProps {
  readonly field: UseFormRegisterReturn
  readonly error?: string
  readonly onQuick: (amount: string) => void
}

const ATAJOS = [2, 5, 10] as const
const CENTS = 100

/**
 * La propina que deja el cliente, aparte de la cuenta.
 *
 * Importa en especial con Yape o tarjeta: entra a la cuenta del local y el
 * cierre de caja dice cuánto hay que darle a cada mesero.
 */
export default function TipField({ field, error, onQuick }: TipFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <TextField
        id="propina"
        label="Propina (opcional)"
        icon="propina"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        hint="No suma a la venta: es del mesero que atendió."
        field={field}
        error={error}
      />
      <div role="group" aria-label="Propinas rápidas" className="grid grid-cols-4 gap-2">
        <Button type="button" variant="outline" className="h-10" onClick={() => {
          onQuick('')
        }}>
          Sin propina
        </Button>
        {ATAJOS.map((monto) => (
          <Button key={monto} type="button" variant="outline" className="h-10" onClick={() => {
            onQuick(String(monto))
          }}>
            {formatCents(monto * CENTS)}
          </Button>
        ))}
      </div>
    </div>
  )
}
