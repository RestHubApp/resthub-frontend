import type { CashSession, CashSummary } from '@/api/types'
import { formatMoney, formatInteger, toCents } from '@/services/format'
import { CashMethodTable } from './CashMethodTable'
import { CashTile } from './CashTile'
import { CashWaiterTable } from './CashWaiterTable'

interface CashSummaryViewProps {
  readonly session: CashSession
  readonly summary: CashSummary
}

/**
 * El arqueo de un turno: lo que entró por cada medio, lo que tiene que haber
 * en el cajón y las propinas que hay que entregar a cada mesero.
 */
export function CashSummaryView({ session, summary }: CashSummaryViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CashTile label="Ventas del turno" value={formatMoney(summary.sales)} />
        <CashTile label="Pedidos cobrados" value={formatInteger(summary.paid_orders)} />
        <CashTile label="Propinas" value={formatMoney(summary.tips)} />
        <CashTile label="Efectivo esperado" value={formatMoney(session.expected_cash ?? summary.expected_cash)} strong />
      </dl>
      <CashMethodTable rows={summary.by_method} />
      <CashWaiterTable rows={summary.by_waiter} />
      {toCents(summary.discounts) + toCents(summary.courtesies) > 0 ? (
        <p className="m-0 text-sm text-muted-foreground">
          Descuentos: {formatMoney(summary.discounts)} en {formatInteger(summary.discounted_orders)}{' '}
          {summary.discounted_orders === 1 ? 'pedido' : 'pedidos'} · Cortesías: {formatMoney(summary.courtesies)}
        </p>
      ) : null}
    </div>
  )
}
