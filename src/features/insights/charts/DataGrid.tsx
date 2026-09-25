import type { ReactNode } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'

export interface GridColumn<T> {
  readonly header: string
  readonly cell: (row: T) => ReactNode
  /** Números alineados a la derecha y con cifras del mismo ancho. */
  readonly numeric?: boolean
}

interface DataGridProps<T> {
  readonly caption: string
  readonly columns: readonly GridColumn<T>[]
  readonly rows: readonly T[]
  readonly rowKey: (row: T) => string
}

const NUMERIC = 'text-right tabular-nums'

/** La vista de tabla de un gráfico: los mismos datos, sin depender del color. */
export default function DataGrid<T>({ caption, columns, rows, rowKey }: DataGridProps<T>) {
  return (
    <div className="max-h-96 overflow-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.header} className={`px-3 ${column.numeric === true ? 'text-right' : ''}`}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.header} className={`px-3 py-2 ${column.numeric === true ? NUMERIC : ''}`}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
