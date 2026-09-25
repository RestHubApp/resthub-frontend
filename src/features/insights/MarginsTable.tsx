import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  type SortingState,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { useState } from 'react'

import type { DishMargin } from '../../api/types'
import Icon from '../../components/Icon'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import MarginBar from './MarginBar'
import { formatInteger, formatMoney, toNumber } from '../../services/format'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic, text: sortFn_text },
})
const helper = createColumnHelper<typeof features, DishMargin>()

function amount(value: string | null): number | undefined {
  return value === null ? undefined : toNumber(value)
}

function money(value: string | null): string {
  return value === null ? '—' : formatMoney(value)
}

const NUMERIC = { sortFn: 'basic', sortUndefined: 'last', sortDescFirst: true } as const

const columns = helper.columns([
  helper.accessor('name', {
    header: 'Plato',
    sortFn: 'text',
    cell: ({ row }) => (
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{row.original.name}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {row.original.category}
          {row.original.recipe_cost === null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-1.5 font-medium text-warning">
              <Icon name="alerta" size={12} />
              Sin receta
            </span>
          ) : null}
        </span>
      </span>
    ),
  }),
  helper.accessor((row) => toNumber(row.price), { id: 'precio', header: 'Precio', ...NUMERIC, cell: ({ row }) => formatMoney(row.original.price) }),
  helper.accessor((row) => amount(row.recipe_cost), { id: 'costo', header: 'Costo de receta', ...NUMERIC, cell: ({ row }) => money(row.original.recipe_cost) }),
  helper.accessor((row) => amount(row.margin_percent), {
    id: 'margen',
    header: 'Margen',
    ...NUMERIC,
    cell: ({ row }) => (row.original.margin_percent === null ? '—' : <MarginBar percent={row.original.margin_percent} />),
  }),
  helper.accessor('quantity_sold', { header: 'Vendidos', ...NUMERIC, cell: ({ row }) => formatInteger(row.original.quantity_sold) }),
  helper.accessor((row) => amount(row.gross_margin), { id: 'bruto', header: 'Ganancia bruta', ...NUMERIC, cell: ({ row }) => money(row.original.gross_margin) }),
])

const SORT_ICON = { asc: 'ordenAscendente', desc: 'ordenDescendente', none: 'ordenar' } as const
const ARIA_SORT = { asc: 'ascending', desc: 'descending', none: 'none' } as const

interface MarginsTableProps {
  readonly dishes: readonly DishMargin[]
}

/**
 * Margen por plato: precio menos el costo de su receta. Se ordena tocando una
 * cabecera. Un plato sin receta no tiene costo: se marca y queda al final.
 */
export default function MarginsTable({ dishes }: MarginsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'bruto', desc: true }])
  const table = useTable({ features, columns, data: dishes, state: { sorting }, onSortingChange: setSorting })

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <caption className="sr-only">Margen por plato, ordenable por columna</caption>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header, index) => {
                const orden = header.column.getIsSorted() || 'none'
                return (
                  <TableHead key={header.id} aria-sort={ARIA_SORT[orden]} className={`px-3 ${index > 0 ? 'text-right' : ''}`}>
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="inline-flex items-center gap-1 rounded-sm font-medium outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <table.FlexRender header={header} />
                      <Icon name={SORT_ICON[orden]} size={14} className={orden === 'none' ? 'opacity-50' : undefined} />
                    </button>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell, index) => (
                <TableCell key={cell.id} className={`px-3 py-2 ${index > 0 ? 'text-right tabular-nums' : ''}`}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
