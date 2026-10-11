import type { CashSummary } from '@/api/types'
import { formatInteger, formatMoney } from '@/services/format'
import { CASH_CELL, CASH_HEADER } from './cashTableStyles'

interface CashMethodTableProps {
  readonly rows: CashSummary['by_method']
}

/** Lo cobrado en el turno por cada medio de pago; sin cobros, un aviso. */
export function CashMethodTable({ rows }: CashMethodTableProps) {
  if (rows.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">Todavía no hay cobros en este turno.</p>
  }

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="pb-2 text-left text-sm font-medium">Por medio de pago</caption>
      <thead>
        <tr className="border-b">
          <th scope="col" className={CASH_HEADER}>Medio</th>
          <th scope="col" className={`${CASH_HEADER} text-right`}>Pagos</th>
          <th scope="col" className={`${CASH_HEADER} text-right`}>Cobrado</th>
          <th scope="col" className={`${CASH_HEADER} text-right`}>Propinas</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.method} className="border-b last:border-0">
            <th scope="row" className="px-3 py-2 text-left font-normal">{row.method_label}</th>
            <td className={CASH_CELL}>{formatInteger(row.payments)}</td>
            <td className={CASH_CELL}>{formatMoney(row.amount)}</td>
            <td className={CASH_CELL}>{formatMoney(row.tips)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
