import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { errorMessage } from '@/services/api'

interface ReservationListStatusProps {
  readonly isPending: boolean
  readonly isError: boolean
  readonly isEmpty: boolean
  readonly error: unknown
  readonly onRetry: () => void
}

/** El estado de las reservas del día: cargando, con error o sin ninguna. */
export function ReservationListStatus({ isPending, isError, isEmpty, error, onRetry }: ReservationListStatusProps) {
  return (
    <>
      {isPending ? <ListSkeleton label="Cargando reservas…" count={3} itemClassName="h-16 rounded-lg" /> : null}
      {isError ? <RetryQueryError message={errorMessage(error, 'No se pudieron cargar las reservas.')} onRetry={onRetry} /> : null}
      {isEmpty ? <EmptyState title="No hay reservas para este día" /> : null}
    </>
  )
}
