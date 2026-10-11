import type { OrderResponse } from '@/api/types'
import { formatMoney, formatTime, toCents } from '@/services/format'
import { useTimeZone } from '@/store/session'

interface PaymentsDoneProps {
  readonly order: OrderResponse
}

/** Los pagos que ya entraron a esta cuenta, en el orden en que se cobraron. */
export function PaymentsDone({ order }: PaymentsDoneProps) {
  const timeZone = useTimeZone()
  if (order.payments.length === 0) {
    return null
  }

  return (
    <section aria-label="Pagos registrados" className="flex flex-col gap-1">
      <h3 className="m-0 text-sm font-medium">Pagos registrados</h3>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
        {order.payments.map((payment) => (
          <li key={payment.id} className="flex items-baseline justify-between gap-2 rounded-md bg-muted px-3 py-2">
            <span>
              {payment.method_label}
              <span className="text-muted-foreground"> · {formatTime(payment.created_at, timeZone)} · {payment.received_by_name}</span>
            </span>
            <span className="tabular-nums">
              {formatMoney(payment.amount)}
              {toCents(payment.tip) > 0 ? <span className="text-muted-foreground"> + {formatMoney(payment.tip)}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
