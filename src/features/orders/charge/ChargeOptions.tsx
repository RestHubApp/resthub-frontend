import { useWatch } from 'react-hook-form'

import type { OrderResponse } from '@/api/types'
import { CashAmountField } from './CashAmountField'
import { changeFor } from './changeFor'
import { tipCents } from './chargeSchema'
import { SplitDetails } from './SplitDetails'
import { SplitModePicker } from './SplitModePicker'
import { TipField } from './TipField'
import type { PaymentDraft } from './usePaymentForm'

interface ChargeOptionsProps {
  readonly order: OrderResponse
  readonly payment: PaymentDraft
}

/** Lo que no hace falta en un cobro común: cómo se divide, la propina y, en efectivo, lo recibido. */
export function ChargeOptions({ order, payment }: ChargeOptionsProps) {
  const { register, formState, setValue, control } = payment.form
  const method = useWatch({ control, name: 'payment_method' })
  const amount = useWatch({ control, name: 'amount_received' })
  const tip = tipCents(useWatch({ control, name: 'tip' })) ?? 0
  const toCharge = payment.part + tip

  return (
    <>
      <SplitModePicker value={payment.mode} onChange={payment.setMode} />
      <SplitDetails order={order} draft={payment} />
      <TipField
        field={register('tip')}
        error={formState.errors.tip?.message}
        onQuick={(quick) => {
          setValue('tip', quick, { shouldValidate: true })
        }}
      />
      {method === 'cash' ? (
        <CashAmountField
          field={register('amount_received')}
          error={formState.errors.amount_received?.message}
          totalCents={toCharge}
          changeCents={changeFor(toCharge, amount)}
          onQuick={(quick) => {
            setValue('amount_received', quick, { shouldValidate: true })
          }}
        />
      ) : null}
    </>
  )
}
