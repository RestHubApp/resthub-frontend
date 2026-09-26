import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { formatMoney, toCents } from '../../../services/format'
import InvoicePanel from '../invoice/InvoicePanel'
import PaymentsDone from './PaymentsDone'

interface ChargeReceiptProps {
  readonly order: OrderResponse
  readonly onClose: () => void
}

/**
 * El resultado del cobro, con el vuelto que calculó el servidor.
 *
 * El vuelto es el del último pago, el que se acaba de cobrar: es el número
 * que importa en la caja, así que va grande y se anuncia.
 */
export default function ChargeReceipt({ order, onClose }: ChargeReceiptProps) {
  const ultimo = order.payments.at(-1)
  const vuelto = ultimo?.change ?? null
  const propinas = toCents(order.tips) > 0

  return (
    <div className="flex flex-col gap-4">
      <div role="status" className="flex flex-col items-center gap-2 rounded-xl bg-success/10 px-4 py-5 text-center text-success">
        <Icon name="listo" size={32} />
        <p className="m-0 font-semibold">
          Pedido #{order.number} pagado · {order.payment_method_label ?? 'el medio elegido'}
        </p>
        {vuelto === null ? (
          <p className="m-0 text-2xl font-bold tabular-nums">{formatMoney(order.total)}</p>
        ) : (
          <p className="m-0 flex flex-col">
            <span className="text-sm font-medium">Vuelto</span>
            <span className="text-4xl font-bold tabular-nums">{formatMoney(vuelto)}</span>
          </p>
        )}
      </div>
      <dl className="m-0 grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Total cobrado</dt>
        <dd className="m-0 text-right tabular-nums">{formatMoney(order.total)}</dd>
        {propinas ? (
          <>
            <dt className="text-muted-foreground">Propinas</dt>
            <dd className="m-0 text-right tabular-nums">{formatMoney(order.tips)}</dd>
          </>
        ) : null}
        {ultimo?.amount_received ? (
          <>
            <dt className="text-muted-foreground">Recibido</dt>
            <dd className="m-0 text-right tabular-nums">{formatMoney(ultimo.amount_received)}</dd>
          </>
        ) : null}
      </dl>
      {order.payments.length > 1 ? <PaymentsDone order={order} /> : null}
      <InvoicePanel order={order} />
      <Button type="button" size="lg" className="h-11" onClick={onClose}>
        Terminar
      </Button>
    </div>
  )
}
