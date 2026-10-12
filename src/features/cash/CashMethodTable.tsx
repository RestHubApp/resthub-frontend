import type { CashSummary } from '@/api/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatInteger, formatMoney } from '@/services/format'

interface CashMethodTableProps {
  readonly rows: CashSummary['by_method']
}

const NUMBER = 'text-right tabular-nums'

/** Lo cobrado en el turno por cada medio de pago; sin cobros, un aviso. */
export function CashMethodTable({ rows }: CashMethodTableProps) {
  if (rows.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">Todavía no hay cobros en este turno.</p>
  }

  return (
    <Table label="Por medio de pago">
      <caption className="pb-2 text-left text-sm font-medium">Por medio de pago</caption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Medio</TableHead>
          <TableHead scope="col" className="text-right">Pagos</TableHead>
          <TableHead scope="col" className="text-right">Cobrado</TableHead>
          <TableHead scope="col" className="text-right">Propinas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.method}>
            <TableHead scope="row" className="font-normal">{row.method_label}</TableHead>
            <TableCell className={NUMBER}>{formatInteger(row.payments)}</TableCell>
            <TableCell className={NUMBER}>{formatMoney(row.amount)}</TableCell>
            <TableCell className={NUMBER}>{formatMoney(row.tips)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
