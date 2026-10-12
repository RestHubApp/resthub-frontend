import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'

interface TableListStatusProps {
  readonly isPending: boolean
  readonly isError: boolean
  readonly isEmpty: boolean
  readonly error: unknown
  readonly onRetry: () => void
}

/** El estado de la lista de mesas: cargando, con error o sin ninguna. */
export function TableListStatus({ isPending, isError, isEmpty, error, onRetry }: TableListStatusProps) {
  return (
    <>
      {isPending ? <ListSkeleton label="Cargando mesas…" count={5} itemClassName="h-14 rounded-lg" /> : null}
      {isError ? <RetryQueryError error={error} fallback="No se pudieron cargar las mesas." onRetry={onRetry} /> : null}
      {isEmpty ? (
        <EmptyState title="Todavía no hay mesas" description="Crea la primera con «Nueva mesa»." />
      ) : null}
    </>
  )
}
