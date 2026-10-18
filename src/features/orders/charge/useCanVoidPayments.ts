import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { useCan } from '@/store/session'

/** Si quien mira puede anular los cobros de este pedido: con la caja a cargo y el pedido servido o pagado. */
export function useCanVoidPayments(order: OrderResponse): boolean {
  const canManageCash = useCan(PERMISSION.cashManage)
  return canManageCash && (order.status === 'served' || order.status === 'paid')
}
