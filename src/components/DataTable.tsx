import { type ColumnDef, type Row, type RowData, useTable } from '@tanstack/react-table'
import { type ReactNode, useMemo } from 'react'

import { usePagination } from '@/hooks/usePagination'
import { features } from './dataTableModel'
import { DataTableHeader } from './DataTableHeader'
import { DataTableRow } from './DataTableRow'
import { DataTableSkeleton } from './DataTableSkeleton'
import { EmptyState } from './EmptyState'
import { TablePagination } from './TablePagination'
import { Table, TableBody } from './ui/table'

/** Lo que una celda sabe de su fila, ademas del dato. */
export interface DataRowContext {
  readonly isExpanded: boolean
  readonly toggleExpanded: () => void
}

/**
 * Una columna, descrita sin tipos de TanStack.
 *
 * Cada listado declara sus columnas con esta forma y la tabla las traduce. Asi
 * las pantallas no dependen de los genericos de la version de TanStack Table,
 * que cambiaron entera de la 8 a la 9.
 */
export interface DataColumn<TData extends RowData> {
  readonly id: string
  readonly header: string
  readonly cell: (row: TData, context: DataRowContext) => ReactNode
  /** Clases de la celda, por ejemplo para que un texto largo pueda partirse. */
  readonly className?: string
}

/** Lo que una celda sabe de su fila. */
function rowContext<TData extends RowData>(row: Row<typeof features, TData>): DataRowContext {
  return {
    isExpanded: row.getIsExpanded(),
    toggleExpanded: () => {
      row.toggleExpanded()
    },
  }
}

/** Traduce una columna propia a la de TanStack. */
function toColumnDef<TData extends RowData>(
  column: DataColumn<TData>,
): ColumnDef<typeof features, TData> {
  return {
    id: column.id,
    header: column.header,
    cell: ({ row }) => column.cell(row.original, rowContext(row)),
  }
}


// Filas de la silueta: las que caben a la vista, no una página entera.
const ROWS_LOADING = 6

interface DataTableProps<TData extends RowData> {
  /** De qué es la tabla: nombra su región desplazable. */
  readonly label: string
  readonly columns: readonly DataColumn<TData>[]
  readonly data: readonly TData[]
  readonly isLoading: boolean
  readonly emptyMessage: string
  readonly getRowId: (row: TData, index: number) => string
  /** Contenido que se despliega debajo de una fila. Sin el, ninguna se abre. */
  readonly renderExpanded?: (row: TData) => ReactNode
  /** Filas por página. Sin él, la tabla muestra todas las filas juntas. */
  readonly pageSize?: number
}

/**
 * Tabla de datos de toda la aplicacion, con TanStack Table y la tabla de shadcn.
 *
 * Resuelve lo comun a cada listado: el estado de carga, el vacio, el
 * desplazamiento horizontal en pantallas angostas y las filas que se
 * despliegan. En el celular la tabla se desplaza en vez de apilarse: WCAG
 * exime a las tablas de datos del reflujo, y apilarla le quita las cabeceras
 * al lector de pantalla.
 */
export function DataTable<TData extends RowData>({
  label,
  columns,
  data,
  isLoading,
  emptyMessage,
  getRowId,
  renderExpanded,
  pageSize,
}: DataTableProps<TData>) {
  const page = usePagination(data, pageSize)
  const rows = useMemo(() => [...page.visible], [page.visible])
  const columnDefs = useMemo(() => columns.map(toColumnDef), [columns])
  const cellClasses = useMemo(
    () => new Map(columns.map((column) => [column.id, column.className ?? ''])),
    [columns],
  )

  const table = useTable({
    features,
    columns: columnDefs,
    data: rows,
    getRowId,
    getRowCanExpand: () => renderExpanded !== undefined,
  })

  if (isLoading) {
    return <DataTableSkeleton label={label} headers={columns.map((column) => column.header)} rows={Math.min(pageSize ?? ROWS_LOADING, ROWS_LOADING)} />
  }
  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />
  }

  return (
    <div className="flex flex-col gap-3">
    <div className="rounded-xl bg-card ring-1 ring-foreground/10">
      <Table label={label}>
        <DataTableHeader table={table} cellClasses={cellClasses} />
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <DataTableRow key={row.id} row={row} cellClasses={cellClasses} renderExpanded={renderExpanded} />
          ))}
        </TableBody>
      </Table>
    </div>
    {page.total > 1 ? (
      <TablePagination actual={page.actual} total={page.total} onChange={page.irA} />
    ) : null}
    </div>
  )
}
