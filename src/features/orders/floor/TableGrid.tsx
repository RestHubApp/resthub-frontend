import { useQuery } from '@tanstack/react-query'
import { tablesQuery } from '@/api/tables'
import { ListSkeleton } from '@/components/ListSkeleton'
import { QueryError } from '@/features/orders/QueryError'
import { EmptyTables } from './EmptyTables'
import { TableCard } from './TableCard'

/** Las mesas activas del salon, en el orden en que las acomodo el encargado. */
export function TableGrid() {
  const tables = useQuery(tablesQuery(false))

  if (tables.isPending) {
    return (
      <ListSkeleton
        label="Cargando mesas…"
        count={8}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
        itemClassName="h-28 rounded-xl"
      />
    )
  }
  if (tables.isError) {
    return (
      <QueryError
        error={tables.error}
        fallback="No se pudieron cargar las mesas."
        onRetry={() => void tables.refetch()}
      />
    )
  }
  if (tables.data.length === 0) {
    return <EmptyTables />
  }

  const free = tables.data.filter((table) => table.active_order === null).length

  return (
    <section aria-labelledby="mesas-titulo" className="flex flex-col gap-3">
      <h2 id="mesas-titulo" className="m-0 text-sm font-medium text-muted-foreground">
        {free} de {tables.data.length} mesas libres
      </h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-4">
        {tables.data.map((table) => (
          <li key={table.id} className="flex flex-col">
            <TableCard table={table} />
          </li>
        ))}
      </ul>
    </section>
  )
}
