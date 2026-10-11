import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { errorMessage } from '@/services/api'

interface CustomerListStatusProps {
  readonly isPending: boolean
  readonly isError: boolean
  readonly isEmpty: boolean
  readonly error: unknown
  /** El texto del vacío: sin clientes o sin coincidencias. */
  readonly emptyTitle: string
  readonly onRetry: () => void
}

/** El estado de la libreta: cargando, con error o sin resultados. */
export function CustomerListStatus({ isPending, isError, isEmpty, error, emptyTitle, onRetry }: CustomerListStatusProps) {
  return (
    <>
      {isPending ? <ListSkeleton label="Cargando clientes…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {isError ? <RetryQueryError message={errorMessage(error, 'No se pudieron cargar los clientes.')} onRetry={onRetry} /> : null}
      {isEmpty ? <EmptyState title={emptyTitle} /> : null}
    </>
  )
}
