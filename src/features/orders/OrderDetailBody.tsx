import { useState } from 'react'

import type { OrderResponse } from '@/api/types'
import type { OrderNoteFlags } from '@/hooks/useOrderNoteFlags'
import { DeliveryCard } from './detail/DeliveryCard'
import { OrderActions } from './detail/OrderActions'
import { OrderHeader } from './detail/OrderHeader'
import { OrderDetailFooter } from './OrderDetailFooter'
import { OrderDialogs } from './OrderDialogs'

interface OrderDetailBodyProps {
  readonly order: OrderResponse
  readonly flagFor: OrderNoteFlags['flagFor']
}

/** El cuerpo del detalle de un pedido, con las ventanas de cobro y cancelacion que abren sus acciones. */
export function OrderDetailBody({ order, flagFor }: OrderDetailBodyProps) {
  const [dialog, setDialog] = useState<'charge' | 'cancel' | null>(null)
  const close = () => {
    setDialog(null)
  }

  return (
    <>
      <OrderHeader order={order} flagFor={flagFor} />
      <DeliveryCard order={order} />
      <OrderActions
        order={order}
        onCharge={() => {
          setDialog('charge')
        }}
        onCancel={() => {
          setDialog('cancel')
        }}
      />
      <OrderDetailFooter order={order} flagFor={flagFor} />
      <OrderDialogs
        chargeOrder={dialog === 'charge' ? order : null}
        cancelOrder={dialog === 'cancel' ? order : null}
        onCloseCharge={close}
        onCloseCancel={close}
      />
    </>
  )
}
