import { Link } from 'react-router'

import { advanceOrder, type OrderStep } from '../../../api/orders'
import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { useCan } from '../../../store/session'
import { nextStepFor, stepDoneMessage } from '../nextStep'
import { isActive } from '../orderLabels'
import { useCanTakeStep } from '../useCanTakeStep'
import { useOrderAction } from '../useOrderAction'

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
export default function OrderActions({ order, onCharge, onCancel }: OrderActionsProps) {
  const paso = nextStepFor(order.status)
  const puede = useCanTakeStep(order, paso)
  const puedeCancelar = useCan('orders.manage')
  const avanzar = useOrderAction({
    mutationFn: (step: OrderStep) => advanceOrder(order.id, step),
    success: stepDoneMessage,
    failure: 'No se pudo actualizar el pedido.',
  })

  if (!isActive(order.status)) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {paso !== undefined && puede ? (
        <Button
          type="button"
          size="lg"
          variant={paso.action === 'charge' ? 'success' : 'default'}
          className={WIDE}
          disabled={avanzar.isPending}
          onClick={() => {
            if (paso.action === 'charge') {
              onCharge()
              return
            }
            avanzar.mutate(paso.action)
          }}
        >
          <Icon name={paso.icon} size={18} />
          <span>{avanzar.isPending ? 'Guardando…' : paso.label}</span>
        </Button>
      ) : (
        <p className="m-0 rounded-lg bg-muted px-4 py-3 text-sm font-medium">{paso?.waiting}</p>
      )}
      <Button asChild variant="outline" size="lg" className={WIDE}>
        <Link to={`/pedidos/${String(order.id)}/agregar`}>
          <Icon name="agregar" size={18} />
          <span>Agregar platos</span>
        </Link>
      </Button>
      {puedeCancelar ? (
        <Button type="button" variant="destructive" size="lg" className={WIDE} onClick={onCancel}>
          <Icon name="cancelar" size={18} />
          <span>Cancelar pedido</span>
        </Button>
      ) : null}
    </div>
  )
}
