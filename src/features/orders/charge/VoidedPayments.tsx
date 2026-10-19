import type { OrderResponse } from '@/api/types'
import { formatMoney, formatTime } from '@/services/format'
import { useTimeZone } from '@/store/session'

/** Los cobros anulados: tachados, con quién lo hizo y por qué (RFS-25). */
export function VoidedPayments({ order }: { readonly order: OrderResponse }) {
  const timeZone = useTimeZone()
  if (order.voided_payments.length === 0) return null

  return (
    <section aria-label="Cobros anulados" className="flex flex-col gap-1">
      <h3 className="m-0 text-sm font-medium">Cobros anulados</h3>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
        {order.voided_payments.map((payment) => (
          <li key={payment.id} className="flex flex-col gap-0.5 rounded-md border border-dashed border-border px-3 py-2">
            <span className="flex items-baseline justify-between gap-2">
              <span className="line-through">{payment.method_label}</span>
              <span className="tabular-nums line-through">{formatMoney(payment.amount)}</span>
            </span>
            <span className="text-muted-foreground">
              {`Anulado ${formatTime(payment.voided_at, timeZone)} por ${payment.voided_by_name || 'alguien del local'}: ${payment.void_reason}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
