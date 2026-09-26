import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchOrder, orderQueryKey } from '../../../api/orders'
import type { OrderResponse } from '../../../api/types'
import FormDialog from '../../../components/FormDialog'
import { orderPlace } from '../orderLabels'
import ChargeForm from './ChargeForm'
import ChargeReceipt from './ChargeReceipt'

interface ChargeContentProps {
  readonly order: OrderResponse
  readonly onClose: () => void
}

/**
 * El pedido se lee de su consulta y no de lo que llegó al abrir: en una
 * cuenta dividida cada pago cambia el saldo, y un descuento cambia el total.
 */
export default function ChargeContent({ order, onClose }: ChargeContentProps) {
  const [cobrado, setCobrado] = useState<OrderResponse | null>(null)
  const vivo = useQuery({
    queryKey: orderQueryKey(order.id),
    queryFn: () => fetchOrder(order.id),
    initialData: order,
  })
  const actual = vivo.data

  return (
    <FormDialog
      open
      size="lg"
      onOpenChange={(abierto) => {
        if (!abierto) {
          onClose()
        }
      }}
      title={cobrado === null ? `Cobrar pedido #${String(actual.number)}` : 'Cobro registrado'}
      description={cobrado === null ? `${orderPlace(actual)} · ${actual.waiter_name}` : undefined}
    >
      {cobrado === null ? (
        <ChargeForm order={actual} onPaid={setCobrado} onCancel={onClose} />
      ) : (
        <ChargeReceipt order={cobrado} onClose={onClose} />
      )}
    </FormDialog>
  )
}
