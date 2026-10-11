import { useQuery } from '@tanstack/react-query'
import { useWatch } from 'react-hook-form'

import { currentCashQuery } from '@/api/cash'
import type { OrderResponse } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { AdjustmentsPanel } from './AdjustmentsPanel'
import { BillSummary } from './BillSummary'
import { CashAmountField } from './CashAmountField'
import { CashClosedNotice } from './CashClosedNotice'
import { amountCents, tipCents } from './chargeSchema'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import { PaymentsDone } from './PaymentsDone'
import { SplitDetails } from './SplitDetails'
import { SplitModePicker } from './SplitModePicker'
import { TipField } from './TipField'
import { usePaymentForm } from './usePaymentForm'

interface ChargeFormProps {
  readonly order: OrderResponse
  readonly onPaid: (order: OrderResponse) => void
  readonly onCancel: () => void
}

function changeFor(dueCents: number, amount: string): number | null {
  if (amount.trim() === '') {
    return 0
  }
  const cents = amountCents(amount)
  return cents === null || cents < dueCents ? null : cents - dueCents
}

/**
 * El cobro de un pedido servido: la cuenta, cómo se divide y cada pago.
 *
 * Una cuenta dividida se cobra de a una persona: después de cada pago el
 * formulario queda listo para la siguiente, con el saldo actualizado.
 */
export function ChargeForm({ order, onPaid, onCancel }: ChargeFormProps) {
  const cashRegister = useQuery(currentCashQuery)
  const payment = usePaymentForm(order, onPaid)
  const { register, formState, setValue, control } = payment.form
  const method = useWatch({ control, name: 'payment_method' })
  const amount = useWatch({ control, name: 'amount_received' })
  const tip = tipCents(useWatch({ control, name: 'tip' })) ?? 0
  const isClosed = cashRegister.data?.is_open === false
  const toCharge = payment.part + tip

  return (
    <div className="flex flex-col gap-5">
      {isClosed ? <CashClosedNotice /> : null}
      <BillSummary order={order} />
      <PaymentsDone order={order} />
      {/* Fuera del formulario del pago: el descuento tiene el suyo, y un
          formulario dentro de otro no es válido. */}
      <AdjustmentsPanel order={order} />
      <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(payment.send)}>
        <SplitModePicker value={payment.mode} onChange={payment.setMode} />
        <SplitDetails order={order} draft={payment} />
        <PaymentMethodPicker field={register('payment_method')} />
        <TipField
          field={register('tip')}
          error={formState.errors.tip?.message}
          onQuick={(amount) => {
            setValue('tip', amount, { shouldValidate: true })
          }}
        />
        {method === 'cash' ? (
          <CashAmountField
            field={register('amount_received')}
            error={formState.errors.amount_received?.message}
            totalCents={toCharge}
            changeCents={changeFor(toCharge, amount)}
            onQuick={(amount) => {
              setValue('amount_received', amount, { shouldValidate: true })
            }}
          />
        ) : null}
        <DialogFormActions>
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onCancel}>
            Volver
          </Button>
          <Button
            type="submit"
            size="lg"
            variant="success"
            className="h-11 px-5 text-base"
            disabled={isClosed || !payment.canCharge}
          >
            <Icon name="payment" size={18} />
            <span>{payment.payment.isPending ? 'Cobrando…' : 'Confirmar pago'}</span>
          </Button>
        </DialogFormActions>
      </form>
    </div>
  )
}
