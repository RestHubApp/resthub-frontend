import type { CashSession, CashSummary } from '../../api/types'
import { formatMoney, formatInteger, toCents } from '../../services/format'
import CashTile from './CashTile'

interface CashSummaryViewProps {
  readonly session: CashSession
  readonly summary: CashSummary
}

const CELDA = 'px-3 py-2 text-right tabular-nums'
const ENCABEZADO = 'px-3 py-2 text-left font-medium text-muted-foreground'

/**
 * El arqueo de un turno: lo que entró por cada medio, lo que tiene que haber
 * en el cajón y las propinas que hay que entregar a cada mesero.
 */
export default function CashSummaryView({ session, summary }: CashSummaryViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CashTile label="Ventas del turno" value={formatMoney(summary.sales)} />
        <CashTile label="Pedidos cobrados" value={formatInteger(summary.paid_orders)} />
        <CashTile label="Propinas" value={formatMoney(summary.tips)} />
        <CashTile label="Efectivo esperado" value={formatMoney(session.expected_cash ?? summary.expected_cash)} strong />
      </dl>
      {summary.by_method.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">Todavía no hay cobros en este turno.</p>
      ) : (
      <table className="w-full border-collapse text-sm">
        <caption className="pb-2 text-left text-sm font-medium">Por medio de pago</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className={ENCABEZADO}>Medio</th>
            <th scope="col" className={`${ENCABEZADO} text-right`}>Pagos</th>
            <th scope="col" className={`${ENCABEZADO} text-right`}>Cobrado</th>
            <th scope="col" className={`${ENCABEZADO} text-right`}>Propinas</th>
          </tr>
        </thead>
        <tbody>
          {summary.by_method.map((fila) => (
            <tr key={fila.method} className="border-b last:border-0">
              <th scope="row" className="px-3 py-2 text-left font-normal">{fila.method_label}</th>
              <td className={CELDA}>{formatInteger(fila.payments)}</td>
              <td className={CELDA}>{formatMoney(fila.amount)}</td>
              <td className={CELDA}>{formatMoney(fila.tips)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      {summary.by_waiter.length === 0 ? null : (
        <table className="w-full border-collapse text-sm">
          <caption className="pb-2 text-left text-sm font-medium">Propinas por mesero (a entregar al cerrar)</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className={ENCABEZADO}>Mesero</th>
              <th scope="col" className={`${ENCABEZADO} text-right`}>Ventas</th>
              <th scope="col" className={`${ENCABEZADO} text-right`}>Propinas</th>
            </tr>
          </thead>
          <tbody>
            {summary.by_waiter.map((fila) => (
              <tr key={fila.waiter_id} className="border-b last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-normal">{fila.name}</th>
                <td className={CELDA}>{formatMoney(fila.sales)}</td>
                <td className={`${CELDA} font-semibold`}>{formatMoney(fila.tips)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {toCents(summary.discounts) + toCents(summary.courtesies) > 0 ? (
        <p className="m-0 text-sm text-muted-foreground">
          Descuentos: {formatMoney(summary.discounts)} en {formatInteger(summary.discounted_orders)}{' '}
          {summary.discounted_orders === 1 ? 'pedido' : 'pedidos'} · Cortesías: {formatMoney(summary.courtesies)}
        </p>
      ) : null}
    </div>
  )
}
