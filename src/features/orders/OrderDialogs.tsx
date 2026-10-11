import { Suspense } from 'react'

import type { OrderResponse } from '@/api/types'
import { lazyNamed } from '@/components/lazyNamed'

// Los diálogos traen react-hook-form y zod: se bajan al abrirlos, no con la pantalla.
const CancelOrderDialog = lazyNamed(() => import('./CancelOrderDialog'), 'CancelOrderDialog')
const ChargeDialog = lazyNamed(() => import('./charge/ChargeDialog'), 'ChargeDialog')

interface OrderDialogsProps {
  /** El pedido a cobrar; `null` mantiene cerrada la ventana de cobro. */
  readonly chargeOrder: OrderResponse | null
  /** El pedido a cancelar; `null` mantiene cerrada la ventana de cancelacion. */
  readonly cancelOrder: OrderResponse | null
  readonly onCloseCharge: () => void
  readonly onCloseCancel: () => void
}

/** Las ventanas de cobro y cancelacion de un pedido, cargadas solo al abrirlas. */
export function OrderDialogs({ chargeOrder, cancelOrder, onCloseCharge, onCloseCancel }: OrderDialogsProps) {
  return (
    <Suspense fallback={null}>
      {chargeOrder === null ? null : <ChargeDialog order={chargeOrder} onClose={onCloseCharge} />}
      {cancelOrder === null ? null : <CancelOrderDialog order={cancelOrder} onClose={onCloseCancel} />}
    </Suspense>
  )
}
