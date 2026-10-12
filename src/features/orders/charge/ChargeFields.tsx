import type { OrderResponse } from '@/api/types'
import { MoreOptions } from '@/components/MoreOptions'
import { AdjustmentsPanel } from './AdjustmentsPanel'
import { ChargeOptions } from './ChargeOptions'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import type { PaymentDraft } from './usePaymentForm'

interface ChargeFieldsProps {
  readonly order: OrderResponse
  readonly payment: PaymentDraft
}

/**
 * Lo que se decide al cobrar: el medio de pago, a la vista, y en «Más
 * opciones» el descuento, cómo se divide la cuenta, la propina y lo recibido.
 *
 * El descuento tiene su propio formulario, y un formulario dentro de otro no es
 * válido: por eso estos campos viven fuera del formulario del pago, que
 * envuelve solo el pie.
 */
export function ChargeFields({ order, payment }: ChargeFieldsProps) {
  const { errors } = payment.form.formState
  const hasOptionError = errors.tip !== undefined || errors.amount_received !== undefined

  return (
    <>
      <PaymentMethodPicker field={payment.form.register('payment_method')} />
      <MoreOptions summary="Descuento, división de la cuenta y propina" isForcedOpen={hasOptionError}>
        <AdjustmentsPanel order={order} />
        <ChargeOptions order={order} payment={payment} />
      </MoreOptions>
    </>
  )
}
