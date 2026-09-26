import type { OrderResponse } from '../../../api/types'
import { formatDateTime } from '../../../services/format'
import { deliveryLines, orderPlace } from '../orderLabels'

interface KitchenTicketProps {
  readonly order: OrderResponse
  readonly timeZone: string
}

/**
 * La comanda: lo que la cocina necesita y nada más.
 *
 * Sin precios. El número va enorme porque es lo que se grita, y las notas
 * de cada plato van debajo del plato, en mayúsculas, para que no se pierdan.
 */
export default function KitchenTicket({ order, timeZone }: KitchenTicketProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-center text-xs uppercase">Comanda</p>
      <p className="m-0 text-center text-4xl font-black">#{order.number}</p>
      <p className="m-0 text-center font-bold">{orderPlace(order)}</p>
      {deliveryLines(order).map((line) => (
        <p key={line} className="m-0 text-center text-sm">{line}</p>
      ))}
      <p className="m-0 text-center text-xs">
        {order.waiter_name} · {formatDateTime(order.updated_at, timeZone)}
      </p>
      <hr className="my-1 border-dashed border-black" />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {order.items.map((item) => (
          <li key={item.id}>
            <p className="m-0 text-lg font-bold">
              {item.quantity} × {item.name}
            </p>
            {item.modifiers.length > 0 ? (
              <p className="m-0 pl-4 text-sm font-semibold">{item.modifiers.map((modifier) => modifier.option).join(' · ')}</p>
            ) : null}
            {item.notes === '' ? null : <p className="m-0 pl-4 text-sm font-semibold uppercase">» {item.notes}</p>}
          </li>
        ))}
      </ul>
      {order.notes === '' ? null : (
        <>
          <hr className="my-1 border-dashed border-black" />
          <p className="m-0 text-sm font-semibold uppercase">Nota: {order.notes}</p>
        </>
      )}
    </div>
  )
}
