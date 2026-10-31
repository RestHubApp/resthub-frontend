import { useQuery } from '@tanstack/react-query'

import { currentCashQuery } from '@/api/cash'
import type { OrderResponse } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { onSubmit } from '@/hooks/formSubmit'
import * as icons from '@/components/icons'
import { BillSummary } from './BillSummary'
import { CashClosedNotice } from './CashClosedNotice'
import { ChargeFields } from './ChargeFields'
import { PaymentsDone } from './PaymentsDone'
import { usePaymentForm } from './usePaymentForm'

interface ChargeFormProps {
  readonly order: OrderResponse
  readonly onPaid: (order: OrderResponse) => void
  readonly onCancel: () => void
}

/**
 * El cobro de un pedido servido: a la vista, el total, el medio de pago y
 * «Confirmar pago»; el descuento, la división y la propina, en «Más opciones».
 *
 * Una cuenta dividida se cobra de a una persona: después de cada pago el
 * formulario queda listo para la siguiente, con el saldo actualizado.
 */
export function ChargeForm({ order, onPaid, onCancel }: ChargeFormProps) {
  const cashRegister = useQuery(currentCashQuery)
  const payment = usePaymentForm(order, onPaid)
  const isClosed = cashRegister.data?.is_open === false

  return (
    <div className="flex flex-col gap-5">
      {isClosed ? <CashClosedNotice /> : null}
      <BillSummary order={order} />
      <PaymentsDone order={order} />
      <ChargeFields order={order} payment={payment} />
      <form noValidate onSubmit={onSubmit(payment.send)}>
        <FormFooter
          mutation={payment.payment}
          onCancel={onCancel}
          cancelLabel="Volver"
          submit={{
            label: 'Confirmar pago',
            pendingLabel: 'Cobrando…',
            icon: icons.payment,
            isDisabled: isClosed || !payment.canCharge,
          }}
        />
      </form>
    </div>
  )
}
