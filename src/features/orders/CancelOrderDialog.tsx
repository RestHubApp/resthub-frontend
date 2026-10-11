import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { cancelOrder } from '@/api/orders'
import type { OrderResponse } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormDialog } from '@/components/FormDialog'
import { textoObligatorio } from '@/components/formRules'
import { TextareaField } from '@/components/TextareaField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { orderPlace } from './orderLabels'
import { useOrderAction } from './useOrderAction'

// El mismo tope que el servidor.
const MAX_REASON = 300
const schema = z.object({ reason: textoObligatorio(MAX_REASON, 'Escribe el motivo') })
type Values = z.infer<typeof schema>

interface CancelOrderDialogProps {
  /** El pedido a cancelar; `null` cierra la ventana. */
  readonly order: OrderResponse | null
  readonly onClose: () => void
}

/**
 * Cancelar un pedido, con su motivo.
 *
 * El motivo es obligatorio: un pedido cancelado sin explicacion es plata que
 * no entro y nadie sabe por que. Queda en el historial.
 */
export function CancelOrderDialog({ order, onClose }: CancelOrderDialogProps) {
  const { register, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  })
  const cancel = useOrderAction({
    mutationFn: (reason: string) => cancelOrder(order?.id ?? 0, reason),
    success: (cancelled) => `Pedido #${String(cancelled.number)} cancelado.`,
    failure: 'No se pudo cancelar el pedido.',
    onSuccess: () => {
      reset()
      onClose()
    },
  })

  if (order === null) {
    return null
  }

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          reset()
          onClose()
        }
      }}
      title={`¿Cancelar el pedido #${String(order.number)}?`}
      description={`${orderPlace(order)}. ${order.type === 'dine_in' ? 'La mesa queda libre y el' : 'El'} pedido pasa al historial como cancelado.`}
    >
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
        <DialogFormActions>
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onClose}>
            Volver
          </Button>
          <Button type="submit" size="lg" variant="danger" className="h-11 px-4" disabled={cancel.isPending}>
            {cancel.isPending ? 'Cancelando…' : 'Cancelar pedido'}
          </Button>
        </DialogFormActions>
      </form>
    </FormDialog>
  )
}
