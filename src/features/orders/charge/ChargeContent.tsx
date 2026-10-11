import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { orderQuery } from '@/api/orders'
import type { OrderResponse } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { orderPlace } from '@/features/orders/orderLabels'
import { ChargeForm } from './ChargeForm'
import { ChargeReceipt } from './ChargeReceipt'

interface ChargeContentProps {
  readonly order: OrderResponse
  readonly onClose: () => void
}

/**
 * El pedido se lee de su consulta y no de lo que llegó al abrir: en una
 * cuenta dividida cada pago cambia el saldo, y un descuento cambia el total.
 */
export function ChargeContent({ order, onClose }: ChargeContentProps) {
  const [charged, setCharged] = useState<OrderResponse | null>(null)
  const live = useQuery({ ...orderQuery(order.id), initialData: order })
  const actual = live.data

  return (
    <FormDialog
      open
      size="lg"
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title={charged === null ? `Cobrar pedido #${String(actual.number)}` : 'Cobro registrado'}
      description={charged === null ? `${orderPlace(actual)} · ${actual.waiter_name}` : undefined}
    >
      {charged === null ? (
        <ChargeForm order={actual} onPaid={setCharged} onCancel={onClose} />
      ) : (
        <ChargeReceipt order={charged} onClose={onClose} />
      )}
    </FormDialog>
  )
}
