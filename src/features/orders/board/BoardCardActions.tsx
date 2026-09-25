import { advanceOrder, type OrderStep } from '../../../api/orders'
import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { useCan } from '../../../store/session'
import { nextStepFor, stepDoneMessage } from '../nextStep'
import { useOrderAction } from '../useOrderAction'

interface BoardCardActionsProps {
  readonly order: OrderResponse
  readonly onCharge: (order: OrderResponse) => void
  readonly onCancel: (order: OrderResponse) => void
}

/** El paso siguiente del pedido y, aparte, cancelar. */
export default function BoardCardActions({ order, onCharge, onCancel }: BoardCardActionsProps) {
  const paso = nextStepFor(order.status)
  const puede = useCan(paso?.permission ?? 'orders.take')
  const puedeCancelar = useCan('orders.manage')
  const avanzar = useOrderAction({
    mutationFn: (step: OrderStep) => advanceOrder(order.id, step),
    success: stepDoneMessage,
    failure: 'No se pudo actualizar el pedido.',
  })

  return (
    <div className="flex flex-wrap gap-2">
      {paso !== undefined && puede ? (
        <Button
          type="button"
          size="lg"
          variant={paso.action === 'charge' ? 'success' : 'default'}
          className="h-11 flex-1 px-3"
          disabled={avanzar.isPending}
          onClick={() => {
            if (paso.action === 'charge') {
              onCharge(order)
              return
            }
            avanzar.mutate(paso.action)
          }}
        >
          <Icon name={paso.icon} size={16} />
          <span>{paso.label}</span>
        </Button>
      ) : null}
      {puedeCancelar ? (
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
