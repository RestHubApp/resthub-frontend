import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { TextField } from '@/components/TextField'
import { centsToApi, formatCents } from '@/services/format'
import * as icons from '@/components/icons'
import { type CloseCashValues, MAX_CASH_NOTES } from './cashSchema'

interface CloseCashFieldsProps {
  readonly register: UseFormRegister<CloseCashValues>
  readonly errors: FieldErrors<CloseCashValues>
  /** Efectivo esperado en el cajón, en centavos. */
  readonly expected: number
}

/** Los campos del cierre: el efectivo contado y una nota opcional. */
export function CloseCashFields({ register, errors, expected }: CloseCashFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
      <TextField
        id="caja-contado"
        label="Efectivo contado"
        icon={icons.payment}
        inputMode="decimal"
        autoComplete="off"
        placeholder={centsToApi(expected)}
        hint={`Esperado: ${formatCents(expected)}`}
        field={register('counted_cash')}
        error={errors.counted_cash?.message}
      />
      <TextField
        id="caja-nota-cierre"
        label="Nota (opcional)"
        maxLength={MAX_CASH_NOTES}
        placeholder="Faltó sencillo, billete falso…"
        field={register('notes')}
        error={errors.notes?.message}
      />
    </div>
  )
}
