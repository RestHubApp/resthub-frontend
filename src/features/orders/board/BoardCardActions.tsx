import { advanceOrder, type OrderStep } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { nextStepFor, stepDoneMessage } from '@/features/orders/nextStep'
import { useOrderAction } from '@/features/orders/useOrderAction'

interface BoardCardActionsProps {
  readonly order: OrderResponse
  readonly onCharge: (order: OrderResponse) => void
  readonly onCancel: (order: OrderResponse) => void
}

/** El paso siguiente del pedido y, aparte, cancelar. */
export function BoardCardActions({ order, onCharge, onCancel }: BoardCardActionsProps) {
  const step = nextStepFor(order.status)
  const can = useCan(step?.permission ?? PERMISSION.ordersTake)
  const canCancel = useCan(PERMISSION.ordersManage)
  const advance = useOrderAction({
    mutationFn: (step: OrderStep) => advanceOrder(order.id, step),
    success: stepDoneMessage,
    failure: 'No se pudo actualizar el pedido.',
  })

  return (
    <div className="flex flex-wrap gap-2">
      {step !== undefined && can ? (
        <Button
          type="button"
          size="lg"
          variant={step.action === 'charge' ? 'success' : 'default'}
          className="h-11 flex-1 px-3"
          disabled={advance.isPending}
          onClick={() => {
            if (step.action === 'charge') {
              onCharge(order)
              return
            }
            advance.mutate(step.action)
          }}
        >
          <Icon name={step.icon} size={16} />
          <span>{step.label}</span>
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="h-11 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Cancelar pedido #${String(order.number)}`}
          onClick={() => {
            onCancel(order)
          }}
        >
          <Icon name="cancelar" size={16} />
          <span>Cancelar</span>
        </Button>
      ) : null}
    </div>
  )
}
