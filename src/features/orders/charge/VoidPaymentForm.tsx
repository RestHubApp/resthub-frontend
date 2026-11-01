import { voidPayment } from '@/api/orders'
import type { OrderResponse, PaymentResponse } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { FormMessage } from '@/components/FormMessage'
import { TextareaField } from '@/components/TextareaField'
import { onSubmit } from '@/hooks/formSubmit'
import { QuickReasons } from '@/features/orders/QuickReasons'
import { MAX_VOID_REASON } from '@/features/orders/voidItemSchema'
import { useVoidReasonForm } from '@/features/orders/useVoidReasonForm'
import { useOrderAction } from '@/features/orders/useOrderAction'
import * as icons from '@/components/icons'
import { QUICK_PAYMENT_VOID_REASONS, voidedPaymentMessage, voidPaymentErrorMessage } from './voidPaymentMessages'

interface VoidPaymentFormProps {
  readonly order: OrderResponse
  readonly payment: PaymentResponse
  readonly onClose: () => void
}

/** El motivo de anular un cobro, escrito o elegido entre los rápidos. */
export function VoidPaymentForm({ order, payment, onClose }: VoidPaymentFormProps) {
  const { register, handleSubmit, formState, setValue } = useVoidReasonForm()
  const voided = useOrderAction({
    mutationFn: (reason: string) => voidPayment(order.id, payment.id, reason),
    success: (updated) => voidedPaymentMessage(payment, updated),
    // «Ya estaba anulado» o «el turno se cerró»: el pedido cambió, se relee.
    shouldRereadOnError: true,
    onSuccess: onClose,
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(handleSubmit((values) => { voided.mutate(values.reason) }))}
    >
      <QuickReasons reasons={QUICK_PAYMENT_VOID_REASONS} onPick={(reason) => { setValue('reason', reason, { shouldValidate: true }) }} />
      <TextareaField
        id="motivo-anular-cobro"
        label="Motivo"
        placeholder="Por qué se anula el cobro"
        maxLength={MAX_VOID_REASON}
        field={register('reason')}
        error={formState.errors.reason?.message}
      />
      {voided.isError ? <FormMessage tone="error">{voidPaymentErrorMessage(voided.error)}</FormMessage> : null}
      <FormFooter
        mutation={voided}
        onCancel={onClose}
        cancelLabel="Volver"
        submit={{ label: 'Anular cobro', pendingLabel: 'Anulando…', icon: icons.cancel, variant: 'destructive' }}
      />
    </form>
  )
}
