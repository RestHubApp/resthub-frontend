import type { OrderResponse } from '../../api/types'
import { useCan, useSession } from '../../store/session'
import type { NextStep } from './nextStep'

/**
 * Si quien mira puede dar el paso que sigue.
 *
 * Además del permiso, cobrar es de quien atendió el pedido o del encargado:
 * un mesero que cubre una mesa ajena la sirve, pero no la cobra. El servidor
 * lo exige igual; acá solo se evita mostrar un botón que va a responder 403.
 */
export function useCanTakeStep(order: OrderResponse, paso: NextStep | undefined): boolean {
  const conPermiso = useCan(paso?.permission ?? 'orders.take')
  const veTodos = useCan('orders.read_all')
  const propio = useSession((state) => state.account?.user.id === order.waiter_id)
  if (paso === undefined || !conPermiso) {
    return false
  }
  return paso.action !== 'charge' || propio || veTodos
}
