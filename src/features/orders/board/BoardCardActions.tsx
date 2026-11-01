import { advanceOrder, type OrderStep } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { ActionsMenu } from '@/components/ActionsMenu'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { nextStepFor, stepDoneMessage } from '@/features/orders/nextStep'
import { useOrderAction } from '@/features/orders/useOrderAction'

interface BoardCardActionsProps {
  readonly order: OrderResponse
  readonly onCharge: (order: OrderResponse) => void
  readonly onCancel: (order: OrderResponse) => void
}

/**
 * El paso siguiente del pedido a la vista, que se toca cien veces por turno, y
 * cancelar tras «⋯»: así un dedo apurado no cae sobre una acción destructiva.
 */
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
    <div className="flex items-center gap-2">
      {step !== undefined && can ? (
        <Button
          type="button"
          className="flex-1 px-3"
          disabled={advance.isPending}
          onClick={() => {
            if (step.action === 'charge') {
              onCharge(order)
              return
            }
            advance.mutate(step.action)
          }}
        >
          <Icon glyph={step.icon} size={16} />
          <span>{step.label}</span>
        </Button>
      ) : null}
      {canCancel ? (
        <ActionsMenu
          label={`Más acciones del pedido #${String(order.number)}`}
          items={[
            {
              label: 'Cancelar pedido',
              icon: icons.cancel,
              isDestructive: true,
              onSelect: () => {
                onCancel(order)
              },
            },
          ]}
        />
      ) : null}
    </div>
  )
}
