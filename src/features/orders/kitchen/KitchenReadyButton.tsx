import { advanceOrder } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { stepDoneMessage } from '@/features/orders/nextStep'
import { useOrderAction } from '@/features/orders/useOrderAction'

interface KitchenReadyButtonProps {
  readonly order: OrderResponse
}

/** El botón «Listo» de la cocina: solo para quien puede marcar y mientras el pedido está en cocina. */
export function KitchenReadyButton({ order }: KitchenReadyButtonProps) {
  const canMark = useCan(PERMISSION.ordersManage) && order.status === 'in_kitchen'
  const ready = useOrderAction({
    mutationFn: () => advanceOrder(order.id, 'ready'),
    success: stepDoneMessage,
    failure: 'No se pudo marcar como listo.',
  })

  if (!canMark) {
    return null
  }
  return (
    <Button
      type="button"
      size="lg"
      className="h-12 text-base"
      disabled={ready.isPending}
      onClick={() => {
        ready.mutate()
      }}
    >
      <Icon name="ready" size={18} />
      <span>{ready.isPending ? 'Guardando…' : 'Listo'}</span>
    </Button>
  )
}
