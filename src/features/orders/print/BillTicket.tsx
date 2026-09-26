import type { OrderResponse } from '../../../api/types'
import { formatDateTime, formatMoney, formatPercent, toCents } from '../../../services/format'
import { deliveryLines, orderPlace } from '../orderLabels'

interface BillTicketProps {
  readonly order: OrderResponse
  readonly restaurant: string
  readonly timeZone: string
}

const FILA = 'flex justify-between gap-2'

/**
 * La cuenta para el cliente: antes de pagar es la precuenta; pagada, el ticket.
 *
 * No es un comprobante de pago electrónico (boleta o factura): esos los emite
 * el sistema aparte y los imprime o envía el proveedor autorizado.
 */
export default function BillTicket({ order, restaurant, timeZone }: BillTicketProps) {
  const pagado = order.status === 'paid'

  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="m-0 text-center text-base font-bold">{restaurant}</p>
      <p className="m-0 text-center text-xs uppercase">{pagado ? 'Ticket de venta' : 'Precuenta'}</p>
      <p className="m-0 text-center text-xs">
        Pedido #{order.number} · {orderPlace(order)} · {formatDateTime(order.paid_at ?? order.updated_at, timeZone)}
      </p>
      {deliveryLines(order).map((line) => (
        <p key={line} className="m-0 text-center text-xs">{line}</p>
      ))}
      <hr className="my-1 border-dashed border-black" />
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {order.items.map((item) => (
          <li key={item.id} className={FILA}>
            <span>
              {item.quantity} × {item.name}
              {item.modifiers.length > 0 ? ` (${item.modifiers.map((modifier) => modifier.option).join(', ')})` : ''}
              {item.is_courtesy ? ' (cortesía)' : ''}
            </span>
            <span className="tabular-nums">{formatMoney(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      <hr className="my-1 border-dashed border-black" />
      {toCents(order.courtesy_amount) > 0 ? (
        <p className={`m-0 ${FILA}`}><span>Cortesías</span><span>− {formatMoney(order.courtesy_amount)}</span></p>
      ) : null}
      {toCents(order.discount_amount) > 0 ? (
        <p className={`m-0 ${FILA}`}>
          <span>Descuento {formatPercent(order.discount_percent)}</span>
          <span>− {formatMoney(order.discount_amount)}</span>
        </p>
      ) : null}
      <p className={`m-0 ${FILA} text-base font-bold`}><span>Total</span><span>{formatMoney(order.total)}</span></p>
      {order.payments.map((pago) => (
        <p key={pago.id} className={`m-0 ${FILA} text-xs`}>
          <span>{pago.method_label}</span>
          <span>{formatMoney(pago.amount)}{toCents(pago.tip) > 0 ? ` + propina ${formatMoney(pago.tip)}` : ''}</span>
        </p>
      ))}
      {order.change === null ? null : (
        <p className={`m-0 ${FILA} text-xs`}><span>Vuelto</span><span>{formatMoney(order.change)}</span></p>
      )}
      <p className="m-0 mt-2 text-center text-xs">¡Gracias por su visita!</p>
    </div>
  )
}
