import { AccessHistoryList } from './AccessHistoryList'
import { EmptyState } from './EmptyState'
import { ListSkeleton } from './ListSkeleton'
import { RetryQueryError } from './RetryQueryError'

type Accesses = Parameters<typeof AccessHistoryList>[0]['accesses']

/** Lo que el panel necesita de la consulta del historial, paginada por tandas. */
interface HistoryQuery {
  readonly isPending: boolean
  readonly isError: boolean
  readonly isFetchingNextPage: boolean
  /** La consulta decide si hay otra tanda (ver `getNextPageParam`), no el largo de la lista. */
  readonly hasNextPage: boolean
  readonly error: unknown
  readonly refetch: () => unknown
  readonly fetchNextPage: () => unknown
}

interface AccessHistoryPanelProps {
  readonly label: string
  readonly history: HistoryQuery
  readonly accesses: Accesses
}

/** El historial de accesos con su carga, su error y su vacío. */
export function AccessHistoryPanel({ label, history, accesses }: AccessHistoryPanelProps) {
  if (history.isPending) return <ListSkeleton label="Cargando los accesos…" count={3} />
  if (history.isError) {
    return <RetryQueryError error={history.error} fallback="No se pudieron cargar los accesos." onRetry={() => { void history.refetch() }} />
  }
  if (accesses.length === 0) return <EmptyState title="Sin accesos registrados" />
  return (
    <AccessHistoryList
      label={label}
      accesses={accesses}
      hasMore={history.hasNextPage}
      isLoadingMore={history.isFetchingNextPage}
      onMore={() => { void history.fetchNextPage() }}
    />
  )
}
