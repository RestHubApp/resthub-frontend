import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { openCash } from '@/api/cash'
import type { OpenCashRequest } from '@/api/types'
import { Icon } from '@/components/Icon'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { formatMoney } from '@/services/format'
import { cashAmountForApi, MAX_CASH_NOTES, openCashSchema, type OpenCashValues } from './cashSchema'
import { useCashMutation } from './useCashMutation'

/**
 * Abrir el turno con el efectivo que hay en el cajón.
 *
 * Sin caja abierta nadie puede cobrar, así que es lo primero del día.
 */
export function OpenCashForm() {
  const { register, handleSubmit, formState } = useForm<OpenCashValues>({
    resolver: zodResolver(openCashSchema),
    defaultValues: { opening_amount: '', notes: '' },
  })
  const open = useCashMutation({
    mutationFn: (payload: OpenCashRequest) => openCash(payload),
    success: (session) => `Caja abierta con ${formatMoney(session.opening_amount)}. Ya se puede cobrar.`,
    failure: 'No se pudo abrir la caja.',
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          open.mutate({ opening_amount: cashAmountForApi(values.opening_amount), notes: values.notes })
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <TextField
          id="caja-inicial"
          label="Efectivo inicial"
          icon="payment"
          inputMode="decimal"
          autoComplete="off"
          placeholder="150.00"
          hint="El sencillo con que arranca el cajón."
          field={register('opening_amount')}
          error={formState.errors.opening_amount?.message}
        />
        <TextField
          id="caja-nota-apertura"
          label="Nota (opcional)"
          maxLength={MAX_CASH_NOTES}
          placeholder="Turno de la mañana…"
          field={register('notes')}
          error={formState.errors.notes?.message}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="lg" variant="success" className="h-11 px-5" disabled={open.isPending}>
          <Icon name="cashRegister" size={18} />
          <span>{open.isPending ? 'Abriendo…' : 'Abrir caja'}</span>
        </Button>
      </div>
    </form>
  )
}
