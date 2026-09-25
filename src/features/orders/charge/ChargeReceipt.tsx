import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { formatMoney } from '../format'

interface ChargeReceiptProps {
  readonly order: OrderResponse
  readonly onClose: () => void
}

/**
 * El resultado del cobro, con el vuelto que calculo el servidor.
 *
 * Es el numero que importa en la caja, asi que va grande y se anuncia.
 */
export default function ChargeReceipt({ order, onClose }: ChargeReceiptProps) {
  const vuelto = order.change

  return (
    <div className="flex flex-col gap-4">
      <div role="status" className="flex flex-col items-center gap-2 rounded-xl bg-success/10 px-4 py-5 text-center text-success">
        <Icon name="listo" size={32} />
        <p className="m-0 font-semibold">
          Pedido #{order.number} cobrado con {order.payment_method_label ?? 'el medio elegido'}
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
      {order.amount_received === null ? null : (
        <dl className="m-0 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="m-0 text-right tabular-nums">{formatMoney(order.total)}</dd>
          <dt className="text-muted-foreground">Recibido</dt>
          <dd className="m-0 text-right tabular-nums">{formatMoney(order.amount_received)}</dd>
        </dl>
      )}
      <Button type="button" size="lg" className="h-11" onClick={onClose}>
        Listo
      </Button>
    </div>
  )
}
