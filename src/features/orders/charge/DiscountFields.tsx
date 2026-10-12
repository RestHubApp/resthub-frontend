import { useQuery } from '@tanstack/react-query'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { PERMISSION } from '@/api/permissions'
import { restaurantQuery } from '@/api/restaurant'
import { TextField } from '@/components/TextField'
import { formatPercent } from '@/services/format'
import { useCan } from '@/store/session'
import { MAX_ADJUSTMENT_REASON, type DiscountValues } from './discountSchema'

interface DiscountFieldsProps {
  readonly register: UseFormRegister<DiscountValues>
  readonly errors: FieldErrors<DiscountValues>
}

/** "Hasta 10 %": lo que el mesero puede descontar sin el encargado. */
function limitHint(withoutCap: boolean, cap: string | undefined): string {
  if (withoutCap) {
    return 'Sin tope: lo aplicas como encargado.'
  }
  return cap === undefined
    ? 'Hasta el tope que fija el encargado.'
    : `Hasta ${formatPercent(cap)}; más, lo aplica el encargado.`
}

/**
 * Los campos del descuento: porcentaje y motivo.
 *
 * El tope del mesero lo decide el servidor; acá se muestra para que nadie
 * escriba un 20 % que va a volver rechazado.
 */
export function DiscountFields({ register, errors }: DiscountFieldsProps) {
  const hasNoCap = useCan(PERMISSION.ordersDiscountAny)
  const restaurant = useQuery({ ...restaurantQuery, enabled: !hasNoCap })

  return (
    <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
      <TextField
        id="descuento-porcentaje"
        label="Descuento %"
        icon="discount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="10"
        field={register('percent')}
        error={errors.percent?.message}
      />
      <TextField
        id="descuento-motivo"
        label="Motivo"
        placeholder="Cliente frecuente, demora en cocina…"
        maxLength={MAX_ADJUSTMENT_REASON}
        hint={limitHint(hasNoCap, restaurant.data?.max_waiter_discount_percent)}
        field={register('reason')}
        error={errors.reason?.message}
      />
    </div>
  )
}
