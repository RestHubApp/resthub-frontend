import { Link } from 'react-router'

import { advanceOrder, type OrderStep } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import { nextStepFor, stepDoneMessage } from '@/features/orders/nextStep'
import { isActive } from '@/features/orders/orderLabels'
import { useCanTakeStep } from '@/features/orders/useCanTakeStep'
import { useOrderAction } from '@/features/orders/useOrderAction'

interface OrderActionsProps {
  readonly order: OrderResponse
  readonly onCharge: () => void
  readonly onCancel: () => void
}

const WIDE = 'h-12 w-full px-5 text-base sm:w-auto'

/**
 * Lo que se puede hacer con el pedido ahora: un paso principal, grande, y los secundarios.
 *
 * El paso depende del estado y del permiso: el mesero ve "Marcar servido"
 * cuando esta listo, el encargado ademas "Marcar listo" y "Cobrar".
 */
export function OrderActions({ order, onCharge, onCancel }: OrderActionsProps) {
  const step = nextStepFor(order.status)
  const can = useCanTakeStep(order, step)
  const canCancel = useCan(PERMISSION.ordersManage)
  const advance = useOrderAction({
    mutationFn: (step: OrderStep) => advanceOrder(order.id, step),
    success: stepDoneMessage,
    failure: 'No se pudo actualizar el pedido.',
  })

  if (!isActive(order.status)) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {step !== undefined && can ? (
        <Button
          type="button"
          size="lg"
          variant={step.action === 'charge' ? 'success' : 'default'}
          className={WIDE}
          disabled={advance.isPending}
          onClick={() => {
            if (step.action === 'charge') {
              onCharge()
              return
            }
            advance.mutate(step.action)
          }}
        >
          <Icon name={step.icon} size={18} />
          <span>{advance.isPending ? 'Guardando…' : step.label}</span>
        </Button>
      ) : (
        <p className="m-0 rounded-lg bg-muted px-4 py-3 text-sm font-medium">{step?.waiting}</p>
      )}
      <Button asChild variant="outline" size="lg" className={WIDE}>
        <Link to={paths.orders.addItems(order.id)}>
          <Icon name="add" size={18} />
          <span>Agregar platos</span>
        </Link>
      </Button>
      {canCancel ? (
        <Button type="button" variant="destructive" size="lg" className={WIDE} onClick={onCancel}>
          <Icon name="cancel" size={18} />
          <span>Cancelar pedido</span>
        </Button>
      ) : null}
    </div>
  )
}
