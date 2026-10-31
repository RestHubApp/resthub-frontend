import { voidOrderItem } from '@/api/orders'
import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { FormMessage } from '@/components/FormMessage'
import { TextareaField } from '@/components/TextareaField'
import { onSubmit } from '@/hooks/formSubmit'
import { QuickReasons } from '@/features/orders/QuickReasons'
import { useOrderAction } from '@/features/orders/useOrderAction'
import * as icons from '@/components/icons'
import { QUICK_VOID_REASONS, voidErrorMessage } from './voidItemMessages'
import { MAX_VOID_REASON } from '@/features/orders/voidItemSchema'
import { useVoidReasonForm } from '@/features/orders/useVoidReasonForm'

interface VoidItemFormProps {
  readonly order: OrderResponse
  readonly item: OrderItemResponse
  readonly onClose: () => void
  /** Con el pedido que devolvió el servidor, ya sin el plato en los totales. */
  readonly onVoided: (order: OrderResponse) => void
}

/** El motivo de la anulación, escrito o elegido entre los rápidos. */
export function VoidItemForm({ order, item, onClose, onVoided }: VoidItemFormProps) {
  const { register, handleSubmit, formState, setValue } = useVoidReasonForm()
  const voidItem = useOrderAction({
    mutationFn: (reason: string) => voidOrderItem(order.id, item.id, reason),
    success: () => `${item.name} anulado.`,
    // «Ya estaba anulado» o «ya tiene pagos»: el pedido cambió, se relee.
    shouldRereadOnError: true,
    onSuccess: onVoided,
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          voidItem.mutate(values.reason)
        }),
      )}
    >
      <QuickReasons
        reasons={QUICK_VOID_REASONS}
        onPick={(reason) => {
          setValue('reason', reason, { shouldValidate: true })
        }}
      />
      <TextareaField
        id="motivo-anulacion"
        label="Motivo"
        placeholder="Por qué se anula el plato"
        maxLength={MAX_VOID_REASON}
        field={register('reason')}
        error={formState.errors.reason?.message}
      />
      {voidItem.isError ? <FormMessage tone="error">{voidErrorMessage(voidItem.error)}</FormMessage> : null}
      <FormFooter
        mutation={voidItem}
        onCancel={onClose}
        cancelLabel="Volver"
        submit={{ label: 'Anular plato', pendingLabel: 'Anulando…', icon: icons.cancel, variant: 'destructive' }}
      />
    </form>
  )
}
