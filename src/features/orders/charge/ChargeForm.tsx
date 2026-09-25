import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { chargeOrder } from '../../../api/orders'
import type { ChargeOrderRequest, OrderResponse } from '../../../api/types'
import DialogFormActions from '../../../components/DialogFormActions'
import { decimalParaApi } from '../../../components/formRules'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { onSubmit } from '../../../hooks/formSubmit'
import { useOrderAction } from '../useOrderAction'
import CashAmountField from './CashAmountField'
import { amountCents, chargeSchema, type ChargeValues } from './chargeSchema'
import PaymentMethodPicker from './PaymentMethodPicker'
import { formatMoney, toCents } from '../../../services/format'

interface ChargeFormProps {
  readonly order: OrderResponse
  readonly onCharged: (order: OrderResponse) => void
  readonly onCancel: () => void
}

function toPayload(valores: ChargeValues): ChargeOrderRequest {
  const efectivo = valores.payment_method === 'cash'
  return {
    payment_method: valores.payment_method,
    amount_received: efectivo ? decimalParaApi(valores.amount_received) : null,
  }
}

function changeFor(totalCents: number, amount: string): number | null {
  if (amount.trim() === '') {
    return 0
  }
  const cents = amountCents(amount)
  return cents === null || cents < totalCents ? null : cents - totalCents
}

export default function ChargeForm({ order, onCharged, onCancel }: ChargeFormProps) {
  const totalCents = toCents(order.total)
  const { register, handleSubmit, formState, setValue, control } = useForm<ChargeValues>({
    resolver: zodResolver(chargeSchema(totalCents)),
    defaultValues: { payment_method: 'cash', amount_received: '' },
  })
  const metodo = useWatch({ control, name: 'payment_method' })
  const monto = useWatch({ control, name: 'amount_received' })
  const cobro = useOrderAction({
    mutationFn: (payload: ChargeOrderRequest) => chargeOrder(order.id, payload),
    failure: 'No se pudo registrar el cobro.',
    onSuccess: onCharged,
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          cobro.mutate(toPayload(valores))
        }),
      )}
    >
      <p className="m-0 flex items-baseline justify-between rounded-lg bg-secondary px-4 py-3 text-secondary-foreground">
        <span className="font-medium">Total a cobrar</span>
        <span className="text-2xl font-bold tabular-nums">{formatMoney(order.total)}</span>
      </p>
      <PaymentMethodPicker field={register('payment_method')} />
      {metodo === 'cash' ? (
        <CashAmountField
          field={register('amount_received')}
          error={formState.errors.amount_received?.message}
          totalCents={totalCents}
          changeCents={changeFor(totalCents, monto)}
          onQuick={(amount) => {
            setValue('amount_received', amount, { shouldValidate: true })
          }}
        />
      ) : null}
      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onCancel}>
          Volver
        </Button>
        <Button type="submit" size="lg" variant="success" className="h-11 px-5 text-base" disabled={cobro.isPending}>
          <Icon name="pago" size={18} />
          <span>{cobro.isPending ? 'Cobrando…' : 'Confirmar cobro'}</span>
        </Button>
      </DialogFormActions>
    </form>
  )
}
