import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { fetchOrder, orderQueryKey } from '../../api/orders'
import FormMessage from '../../components/FormMessage'
import { isActive, orderPlace } from './orderLabels'
import TakeOrder from './taking/TakeOrder'

/** Agregar platos a un pedido que ya existe. */
export default function AddItemsView() {
  const orderId = Number(useParams().orderId)
  const pedido = useQuery({ queryKey: orderQueryKey(orderId), queryFn: () => fetchOrder(orderId) })
  const order = pedido.data
  const cerrado = order !== undefined && !isActive(order.status)

  return (
    <TakeOrder
      target={{ kind: 'add', orderId }}
      title={order === undefined ? 'Agregar platos' : `Pedido #${String(order.number)} · ${orderPlace(order)}`}
      description="Agrega platos. Si el pedido ya estaba listo o servido, vuelve a cocina."
      notice={
        cerrado ? (
          <FormMessage tone="error">Este pedido ya está {order.status_label.toLowerCase()}: no admite más platos.</FormMessage>
        ) : undefined
      }
    />
  )
}
