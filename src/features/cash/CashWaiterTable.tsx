import type { CashSummary } from '@/api/types'
import { formatMoney } from '@/services/format'
import { CASH_CELL, CASH_HEADER } from './cashTableStyles'

interface CashWaiterTableProps {
  readonly rows: CashSummary['by_waiter']
}

/** Las propinas que hay que entregar a cada mesero al cerrar; sin filas, no se muestra. */
export function CashWaiterTable({ rows }: CashWaiterTableProps) {
  if (rows.length === 0) {
    return null
  }

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="pb-2 text-left text-sm font-medium">Propinas por mesero (a entregar al cerrar)</caption>
      <thead>
        <tr className="border-b">
          <th scope="col" className={CASH_HEADER}>Mesero</th>
          <th scope="col" className={`${CASH_HEADER} text-right`}>Ventas</th>
          <th scope="col" className={`${CASH_HEADER} text-right`}>Propinas</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.waiter_id} className="border-b last:border-0">
            <th scope="row" className="px-3 py-2 text-left font-normal">{row.name}</th>
            <td className={CASH_CELL}>{formatMoney(row.sales)}</td>
            <td className={`${CASH_CELL} font-semibold`}>{formatMoney(row.tips)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
