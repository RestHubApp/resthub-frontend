import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { staffOf, useCan, useSession } from '@/store/session'
import type { NextStep } from './nextStep'

/**
 * Si quien mira puede dar el paso que sigue.
 *
 * Además del permiso, cobrar es de quien atendió el pedido o del encargado:
 * un mesero que cubre una mesa ajena la sirve, pero no la cobra. El servidor
 * lo exige igual; acá solo se evita mostrar un botón que va a responder 403.
 */
export function useCanTakeStep(order: OrderResponse, step: NextStep | undefined): boolean {
  const hasPermission = useCan(step?.permission ?? PERMISSION.ordersTake)
  const canViewAll = useCan(PERMISSION.ordersReadAll)
  const isOwn = useSession((state) => staffOf(state.account)?.user.id === order.waiter_id)
  if (step === undefined || !hasPermission) {
    return false
  }
  return step.action !== 'charge' || isOwn || canViewAll
}
