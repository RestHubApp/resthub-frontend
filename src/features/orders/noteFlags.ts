import type { OrderResponse } from '../../api/types'
import type { OrderNoteFlag, OrderNoteFlags } from '../../hooks/useOrderNoteFlags'

export type FlagFor = OrderNoteFlags['flagFor']

/** La primera nota del pedido (suya o de un plato) que menciona una alergia. */
export function allergyIn(order: OrderResponse, flagFor: FlagFor): OrderNoteFlag | undefined {
  const notas = [flagFor(order.id, null), ...order.items.map((item) => flagFor(order.id, item.id))]
  return notas.find((flag) => flag?.mentions_allergy === true)
}
