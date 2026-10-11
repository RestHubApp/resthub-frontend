import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { ListSkeleton } from '@/components/ListSkeleton'
import { errorMessage } from '@/services/apiError'

interface CashHistoryStatusProps {
  readonly isPending: boolean
  /** El error de la carga, o `null` si no falló. */
  readonly error: Error | null
  /** La carga terminó y no hay turnos. */
  readonly isEmpty: boolean
}

/** Lo que se ve en lugar de la lista de turnos: cargando, error o vacío. */
export function CashHistoryStatus({ isPending, error, isEmpty }: CashHistoryStatusProps) {
  return (
    <>
      {isPending ? <ListSkeleton label="Cargando turnos…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {error === null ? null : (
        <FormMessage tone="error">{errorMessage(error, 'No se pudieron cargar los turnos.')}</FormMessage>
      )}
      {isEmpty ? <EmptyState title="Todavía no hay turnos de caja" /> : null}
    </>
  )
}
