import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { applyDiscount } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import { restaurantQuery } from '@/api/restaurant'
import type { DiscountRequest, OrderResponse } from '@/api/types'
import { decimalForApi } from '@/components/formRules'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { formatPercent } from '@/services/format'
import { useCan } from '@/store/session'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { MAX_ADJUSTMENT_REASON, discountSchema, type DiscountValues } from './discountSchema'

interface DiscountFormProps {
  readonly order: OrderResponse
  readonly onDone: () => void
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
 * El descuento del pedido, en porcentaje y con motivo.
 *
 * El tope del mesero lo decide el servidor; acá se muestra para que nadie
 * escriba un 20 % que va a volver rechazado.
 */
export function DiscountForm({ order, onDone }: DiscountFormProps) {
  const hasNoCap = useCan(PERMISSION.ordersDiscountAny)
  const restaurant = useQuery({ ...restaurantQuery, enabled: !hasNoCap })
  const { register, handleSubmit, formState } = useForm<DiscountValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: { percent: '', reason: '' },
  })
  const discount = useOrderAction({
    mutationFn: (payload: DiscountRequest) => applyDiscount(order.id, payload),
    success: (updatedOrder) => `Descuento de ${formatPercent(updatedOrder.discount_percent)} aplicado.`,
    failure: 'No se pudo aplicar el descuento.',
    onSuccess: onDone,
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-3 rounded-lg bg-muted p-3"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          discount.mutate({ percent: decimalForApi(values.percent) ?? '0', reason: values.reason })
        }),
      )}
    >
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <TextField
          id="descuento-porcentaje"
          label="Descuento %"
          icon="discount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="10"
          field={register('percent')}
          error={formState.errors.percent?.message}
        />
        <TextField
          id="descuento-motivo"
          label="Motivo"
          placeholder="Cliente frecuente, demora en cocina…"
          maxLength={MAX_ADJUSTMENT_REASON}
          hint={limitHint(hasNoCap, restaurant.data?.max_waiter_discount_percent)}
          field={register('reason')}
          error={formState.errors.reason?.message}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Volver
        </Button>
        <Button type="submit" disabled={discount.isPending}>
          {discount.isPending ? 'Aplicando…' : 'Aplicar descuento'}
        </Button>
      </div>
    </form>
  )
}
