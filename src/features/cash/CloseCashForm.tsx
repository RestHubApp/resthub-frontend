import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { closeCash } from '../../api/cash'
import type { CashSession, CloseCashRequest } from '../../api/types'
import Icon from '../../components/Icon'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { centsToApi, formatCents, toCents } from '../../services/format'
import { cashAmountForApi, closeCashSchema, type CloseCashValues, MAX_CASH_NOTES } from './cashSchema'
import { useCashMutation } from './useCashMutation'

interface CloseCashFormProps {
  readonly session: CashSession
  readonly onClosed: (session: CashSession) => void
}

const MONTO = /^\d{1,8}(?:[.,]\d{1,2})?$/u

/** "Sobran S/ 2.00", "Faltan S/ 4.00" o "Cuadra". */
function differenceLabel(cents: number): string {
  if (cents === 0) {
    return 'Cuadra'
  }
  return cents > 0 ? `Sobran ${formatCents(cents)}` : `Faltan ${formatCents(-cents)}`
}

/**
 * Cerrar el turno: se cuenta el efectivo del cajón y se compara con lo esperado.
 *
 * La diferencia se ve mientras se escribe, antes de confirmar: si no cuadra,
 * conviene volver a contar antes de firmar el arqueo.
 */
export default function CloseCashForm({ session, onClosed }: CloseCashFormProps) {
  const esperado = toCents(session.summary?.expected_cash ?? '0')
  const { register, handleSubmit, formState, control } = useForm<CloseCashValues>({
    resolver: zodResolver(closeCashSchema),
    defaultValues: { counted_cash: '', notes: '' },
  })
  const contado = useWatch({ control, name: 'counted_cash' }).trim()
  const diferencia = MONTO.test(contado) ? toCents(cashAmountForApi(contado)) - esperado : null
  const cerrar = useCashMutation({
    mutationFn: (payload: CloseCashRequest) => closeCash(payload),
    success: (cerrada) => `Caja cerrada. ${differenceLabel(toCents(cerrada.difference ?? '0'))}.`,
    failure: 'No se pudo cerrar la caja.',
    onSuccess: onClosed,
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          cerrar.mutate({ counted_cash: cashAmountForApi(valores.counted_cash), notes: valores.notes })
        }),
      )}
    >
      {session.open_orders > 0 ? (
        <p role="status" className="m-0 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          {session.open_orders === 1 ? 'Hay 1 pedido sin cobrar' : `Hay ${String(session.open_orders)} pedidos sin cobrar`}.
          Puedes cerrar igual: se cobra en el turno siguiente.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <TextField
          id="caja-contado"
          label="Efectivo contado"
          icon="pago"
          inputMode="decimal"
          autoComplete="off"
          placeholder={centsToApi(esperado)}
          hint={`Esperado: ${formatCents(esperado)}`}
          field={register('counted_cash')}
          error={formState.errors.counted_cash?.message}
        />
        <TextField
          id="caja-nota-cierre"
          label="Nota (opcional)"
          maxLength={MAX_CASH_NOTES}
          placeholder="Faltó sencillo, billete falso…"
          field={register('notes')}
          error={formState.errors.notes?.message}
        />
      </div>
      <p aria-live="polite" className="m-0 flex items-baseline justify-between rounded-lg bg-muted px-4 py-3">
        <span className="font-medium">Diferencia</span>
        <span className="text-xl font-bold tabular-nums">
          {diferencia === null ? '—' : differenceLabel(diferencia)}
        </span>
      </p>
      <div className="flex justify-end">
        <Button type="submit" size="lg" variant="destructive" className="h-11 px-5" disabled={cerrar.isPending}>
          <Icon name="caja" size={18} />
          <span>{cerrar.isPending ? 'Cerrando…' : 'Cerrar caja'}</span>
        </Button>
      </div>
    </form>
  )
}
