import { Link } from 'react-router'

import { advanceOrder, type OrderStep } from '@/api/orders'
import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { nextStepFor, stepDoneMessage } from '@/features/orders/nextStep'
import { isActive } from '@/features/orders/orderLabels'
import { useCanTakeStep } from '@/features/orders/useCanTakeStep'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { OrderMoreActions } from './OrderMoreActions'

interface OrderActionsProps {
  readonly order: OrderResponse
  readonly onCharge: () => void
  readonly onCancel: () => void
}

const WIDE = 'w-full sm:w-auto'

/**
 * Lo que se puede hacer con el pedido ahora: un paso principal, grande,
 * «Agregar platos» y «Más acciones» con el resto.
 *
 * El paso depende del estado y del permiso: el mesero ve "Marcar servido"
 * cuando esta listo, el encargado ademas "Marcar listo" y "Cobrar".
 */
export function OrderActions({ order, onCharge, onCancel }: OrderActionsProps) {
  const step = nextStepFor(order.status)
  const can = useCanTakeStep(order, step)
  const advance = useOrderAction({
    mutationFn: (step: OrderStep) => advanceOrder(order.id, step),
    success: stepDoneMessage,
    failure: 'No se pudo actualizar el pedido.',
  })

  if (!isActive(order.status)) {
    return (
      <div className="flex">
        <OrderMoreActions order={order} onCancel={onCancel} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {step !== undefined && can ? (
        <Button
          type="button"
          size="lg"
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
      <OrderMoreActions order={order} onCancel={onCancel} />
    </div>
  )
}
