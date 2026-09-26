import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { tablesQuery } from '../../../api/tables'
import EmptyState from '../../../components/EmptyState'
import ListSkeleton from '../../../components/ListSkeleton'
import { Button } from '../../../components/ui/button'
import { useCan } from '../../../store/session'
import QueryError from '../QueryError'
import TableCard from './TableCard'

/** Las mesas activas del salon, en el orden en que las acomodo el encargado. */
export default function TableGrid() {
  const mesas = useQuery(tablesQuery(false))
  const canManage = useCan('tables.manage')

  if (mesas.isPending) {
    return (
      <ListSkeleton
        label="Cargando mesas…"
        count={8}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
        itemClassName="h-28 rounded-xl"
      />
    )
  }
  if (mesas.isError) {
    return (
      <QueryError
        error={mesas.error}
        fallback="No se pudieron cargar las mesas."
        onRetry={() => void mesas.refetch()}
      />
    )
  }
  if (mesas.data.length === 0) {
    return (
      <EmptyState
        title="No hay mesas activas"
        description="Los pedidos para llevar siguen funcionando."
      >
        {canManage ? (
          <Button asChild variant="outline" size="lg" className="h-11 px-4">
            <Link to="/mesas">Crear mesas</Link>
          </Button>
        ) : null}
      </EmptyState>
    )
  }

  const libres = mesas.data.filter((mesa) => mesa.active_order === null).length

  return (
    <section aria-labelledby="mesas-titulo" className="flex flex-col gap-3">
      <h2 id="mesas-titulo" className="m-0 text-sm font-medium text-muted-foreground">
        {libres} de {mesas.data.length} mesas libres
      </h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-4">
        {mesas.data.map((mesa) => (
          <li key={mesa.id} className="flex flex-col">
            <TableCard table={mesa} />
          </li>
        ))}
      </ul>
    </section>
  )
}
