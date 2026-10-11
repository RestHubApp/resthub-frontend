import type { OrderResponse } from '@/api/types'
import { formatMoney, toCents } from '@/services/format'

interface ReceiptTotalsProps {
  readonly order: OrderResponse
  /** Lo que entregó el cliente en el último pago, o vacío si no aplica. */
  readonly received: string
}

/** Total cobrado, propinas y lo recibido; las dos últimas solo si existen. */
export function ReceiptTotals({ order, received }: ReceiptTotalsProps) {
  const hasTips = toCents(order.tips) > 0

  return (
    <dl className="m-0 grid grid-cols-2 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Total cobrado</dt>
      <dd className="m-0 text-right tabular-nums">{formatMoney(order.total)}</dd>
      {hasTips ? (
        <>
          <dt className="text-muted-foreground">Propinas</dt>
          <dd className="m-0 text-right tabular-nums">{formatMoney(order.tips)}</dd>
        </>
      ) : null}
      {received !== '' ? (
        <>
          <dt className="text-muted-foreground">Recibido</dt>
          <dd className="m-0 text-right tabular-nums">{formatMoney(received)}</dd>
        </>
      ) : null}
    </dl>
  )
}
