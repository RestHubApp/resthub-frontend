import { zodResolver } from '@hookform/resolvers/zod'
import { useWatch } from 'react-hook-form'

import type { CashSession } from '@/api/types'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { toCents } from '@/services/format'
import { cashAmountForApi, closeCashSchema, type CloseCashValues } from './cashSchema'
import { CashDifferenceBar } from './CashDifferenceBar'
import { CloseCashButton } from './CloseCashButton'
import { CloseCashFields } from './CloseCashFields'
import { OpenOrdersWarning } from './OpenOrdersWarning'
import { useCloseCash } from './useCloseCash'

interface CloseCashFormProps {
  readonly session: CashSession
  readonly onClosed: (session: CashSession) => void
}

// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const AMOUNT = /^\d{1,8}(?:[.,]\d{1,2})?$/u

/**
 * Cerrar el turno: se cuenta el efectivo del cajón y se compara con lo esperado.
 *
 * La diferencia se ve mientras se escribe, antes de confirmar: si no cuadra,
 * conviene volver a contar antes de firmar el arqueo. Cerrar mueve dinero y
 * no se deshace, así que se confirma con el monto y la diferencia a la vista.
 */
export function CloseCashForm({ session, onClosed }: CloseCashFormProps) {
  const expected = toCents(session.summary?.expected_cash ?? '0')
  const { register, handleSubmit, formState, control } = useAppForm<CloseCashValues>({
    resolver: zodResolver(closeCashSchema),
    defaultValues: { counted_cash: '', notes: '' },
  })
  const cash = useWatch({ control, name: 'counted_cash' }).trim()
  const difference = AMOUNT.test(cash) ? toCents(cashAmountForApi(cash)) - expected : null
  const close = useCloseCash(onClosed)

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          close.ask({ counted_cash: cashAmountForApi(values.counted_cash), notes: values.notes })
        }),
      )}
    >
      <OpenOrdersWarning count={session.open_orders} />
      <CloseCashFields register={register} errors={formState.errors} expected={expected} />
      <CashDifferenceBar difference={difference} />
      <div className="flex justify-end">
        <CloseCashButton
          pending={close.isPending}
          expected={expected}
          difference={difference}
          open={close.isConfirming}
          onCancel={close.cancel}
          onConfirm={close.confirm}
        />
      </div>
    </form>
  )
}
