import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { closeCash } from '../../api/cash'
import type { CashSession, CloseCashRequest } from '../../api/types'
import TextField from '../../components/TextField'
import { onSubmit } from '../../hooks/formSubmit'
import { centsToApi, formatCents, toCents } from '../../services/format'
import { cashAmountForApi, closeCashSchema, type CloseCashValues, MAX_CASH_NOTES } from './cashSchema'
import { differenceLabel } from './cashDifference'
import CloseCashButton from './CloseCashButton'
import { useCashMutation } from './useCashMutation'

interface CloseCashFormProps {
  readonly session: CashSession
  readonly onClosed: (session: CashSession) => void
}

const MONTO = /^\d{1,8}(?:[.,]\d{1,2})?$/u

/**
 * Cerrar el turno: se cuenta el efectivo del cajón y se compara con lo esperado.
 *
 * La diferencia se ve mientras se escribe, antes de confirmar: si no cuadra,
 * conviene volver a contar antes de firmar el arqueo. Cerrar mueve dinero y
 * no se deshace, así que se confirma con el monto y la diferencia a la vista.
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

  // Cerrar mueve dinero y no se deshace: un monto válido abre la confirmación
  // y solo al confirmarla sale el cierre. Enter en el monto hace lo mismo.
  const [porConfirmar, setPorConfirmar] = useState<CloseCashRequest | null>(null)

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          setPorConfirmar({ counted_cash: cashAmountForApi(valores.counted_cash), notes: valores.notes })
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
        <CloseCashButton
          pending={cerrar.isPending}
          expected={esperado}
          difference={diferencia}
          open={porConfirmar !== null}
          onCancel={() => {
            setPorConfirmar(null)
          }}
          onConfirm={() => {
            if (porConfirmar !== null) {
              cerrar.mutate(porConfirmar)
            }
            setPorConfirmar(null)
          }}
        />
      </div>
    </form>
  )
}
