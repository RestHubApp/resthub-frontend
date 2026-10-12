import { flexRender, type RowData, type Table } from '@tanstack/react-table'

import type { features } from './dataTableModel'
import { TableHead, TableHeader, TableRow } from './ui/table'

interface DataTableHeaderProps<TData extends RowData> {
  readonly table: Table<typeof features, TData>
  /** Clases extra de cada celda, por id de columna. */
  readonly cellClasses: ReadonlyMap<string, string>
}

/** La cabecera de la tabla de datos: una fila de títulos por grupo de columnas. */
export function DataTableHeader<TData extends RowData>({ table, cellClasses }: DataTableHeaderProps<TData>) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id} className={`px-3 ${cellClasses.get(header.column.id) ?? ''}`}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )
}
