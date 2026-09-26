import type { ObsRouteSort } from '../../../api/types'
import Icon from '../../../components/Icon'
import { TableHead } from '../../../components/ui/table'
import { ariaSort } from './routeSort'

interface SortHeaderProps {
  readonly column: ObsRouteSort
  readonly sort: ObsRouteSort
  readonly label: string
  readonly onSort: (column: ObsRouteSort) => void
}

/** La cabecera de una columna que ordena la tabla, de mayor a menor. */
export default function SortHeader({ column, sort, label, onSort }: SortHeaderProps) {
  const actual = column === sort
  return (
    <TableHead aria-sort={ariaSort(column, sort)} className="px-1 text-right">
      <button
        type="button"
        onClick={() => {
          onSort(column)
        }}
        className={`inline-flex min-h-11 items-center gap-1 rounded-md px-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 ${actual ? 'font-semibold' : 'font-medium text-muted-foreground'}`}
      >
        <span>{label}</span>
        <Icon name={actual ? 'ordenDescendente' : 'ordenar'} size={14} />
        <span className="sr-only">{actual ? ', de mayor a menor' : ', ordenar de mayor a menor'}</span>
      </button>
    </TableHead>
  )
}
