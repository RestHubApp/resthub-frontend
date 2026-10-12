import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { cancelOrder } from '@/api/orders'
import type { OrderResponse } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { textRequired } from '@/components/formRules'
import { TextareaField } from '@/components/TextareaField'
import { onSubmit } from '@/hooks/formSubmit'
import { useOrderAction } from './useOrderAction'

// El mismo tope que el servidor.
const MAX_REASON = 300
const schema = z.object({ reason: textRequired(MAX_REASON, 'Escribe el motivo') })
type Values = z.infer<typeof schema>

interface CancelOrderFormProps {
  readonly order: OrderResponse
  readonly onClose: () => void
}

/** El formulario del motivo de cancelacion; al cancelar con exito se limpia y cierra la ventana. */
export function CancelOrderForm({ order, onClose }: CancelOrderFormProps) {
  const { register, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  })
  const cancel = useOrderAction({
    mutationFn: (reason: string) => cancelOrder(order.id, reason),
    success: (cancelled) => `Pedido #${String(cancelled.number)} cancelado.`,
    failure: 'No se pudo cancelar el pedido.',
    onSuccess: () => {
      reset()
      onClose()
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          cancel.mutate(values.reason)
        }),
      )}
    >
      <TextareaField
        id="motivo-cancelacion"
        label="Motivo"
        placeholder="El cliente se fue, pedido duplicado…"
        maxLength={MAX_REASON}
        field={register('reason')}
        error={formState.errors.reason?.message}
      />
      <FormFooter
        mutation={cancel}
        onCancel={onClose}
        cancelLabel="Volver"
        submit={{ label: 'Cancelar pedido', pendingLabel: 'Cancelando…', variant: 'danger' }}
      />
    </form>
  )
}
