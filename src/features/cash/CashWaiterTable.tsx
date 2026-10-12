import type { CashSummary } from '@/api/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMoney } from '@/services/format'

interface CashWaiterTableProps {
  readonly rows: CashSummary['by_waiter']
}

const NUMBER = 'text-right tabular-nums'

/** Las propinas que hay que entregar a cada mesero al cerrar; sin filas, no se muestra. */
export function CashWaiterTable({ rows }: CashWaiterTableProps) {
  if (rows.length === 0) {
    return null
  }

  return (
    <Table label="Propinas por mesero">
      <caption className="pb-2 text-left text-sm font-medium">Propinas por mesero (a entregar al cerrar)</caption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Mesero</TableHead>
          <TableHead scope="col" className="text-right">Ventas</TableHead>
          <TableHead scope="col" className="text-right">Propinas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.waiter_id}>
            <TableHead scope="row" className="font-normal">{row.name}</TableHead>
            <TableCell className={NUMBER}>{formatMoney(row.sales)}</TableCell>
            <TableCell className={`${NUMBER} font-semibold`}>{formatMoney(row.tips)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
