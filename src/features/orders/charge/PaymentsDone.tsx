import type { OrderResponse } from '@/api/types'
import { formatMoney, formatTime, toCents } from '@/services/format'
import { useTimeZone } from '@/store/session'
import { VoidPaymentButton } from './VoidPaymentButton'
import { VoidedPayments } from './VoidedPayments'

interface PaymentsDoneProps {
  readonly order: OrderResponse
  /** Ofrece «Anular» en cada cobro (RFS-25). Solo en el detalle del pedido: dentro del cobro no se abre otra ventana. */
  readonly canVoid?: boolean
}

/** Los pagos que ya entraron a esta cuenta, en el orden en que se cobraron, y los anulados. */
export function PaymentsDone({ order, canVoid = false }: PaymentsDoneProps) {
  const timeZone = useTimeZone()
  if (order.payments.length === 0 && order.voided_payments.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      {order.payments.length > 0 ? (
        <section aria-label="Pagos registrados" className="flex flex-col gap-1">
          <h3 className="m-0 text-sm font-medium">Pagos registrados</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            {order.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted px-3 py-2">
                <span>
                  {payment.method_label}
                  <span className="text-muted-foreground"> · {formatTime(payment.created_at, timeZone)} · {payment.received_by_name}</span>
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  {formatMoney(payment.amount)}
                  {toCents(payment.tip) > 0 ? <span className="text-muted-foreground"> + {formatMoney(payment.tip)}</span> : null}
                  {canVoid ? <VoidPaymentButton order={order} payment={payment} /> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <VoidedPayments order={order} />
    </div>
  )
}
