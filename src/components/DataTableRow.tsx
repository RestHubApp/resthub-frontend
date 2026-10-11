import { flexRender, type Row, type RowData } from '@tanstack/react-table'
import type { ReactNode } from 'react'

import type { features } from './dataTableModel'
import { TableCell, TableRow } from './ui/table'

interface DataTableRowProps<TData extends RowData> {
  readonly row: Row<typeof features, TData>
  /** Clases extra de cada celda, por id de columna. */
  readonly cellClasses: ReadonlyMap<string, string>
  readonly renderExpanded?: ((row: TData) => ReactNode) | undefined
}

/** Una fila de la tabla de datos y, si está desplegada, su contenido expandido. */
export function DataTableRow<TData extends RowData>({ row, cellClasses, renderExpanded }: DataTableRowProps<TData>) {
  return (
    <>
      <TableRow data-state={row.getIsExpanded() ? 'open' : undefined}>
        {row.getAllCells().map((cell) => (
          <TableCell key={cell.id} className={`px-3 py-2.5 ${cellClasses.get(cell.column.id) ?? ''}`}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
      {row.getIsExpanded() && renderExpanded !== undefined ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={row.getAllCells().length} className="bg-muted/40 p-4 whitespace-normal">
            {renderExpanded(row.original)}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
