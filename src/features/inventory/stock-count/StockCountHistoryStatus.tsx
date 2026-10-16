import { EmptyState } from '@/components/EmptyState'
import { ErrorMessage } from '@/components/ErrorMessage'
import { ListSkeleton } from '@/components/ListSkeleton'

interface StockCountHistoryStatusProps {
  readonly isPending: boolean
  readonly error: unknown
  readonly isEmpty: boolean
}

/** Mientras carga, si falló o si todavía no hay conteos. */
export function StockCountHistoryStatus({ isPending, error, isEmpty }: StockCountHistoryStatusProps) {
  if (isPending) {
    return <ListSkeleton label="Cargando los conteos…" count={3} itemClassName="h-14 rounded-lg" />
  }
  if (error !== null) {
    return <ErrorMessage error={error} fallback="No se pudieron cargar los conteos." />
  }
  return isEmpty ? <EmptyState title="Todavía no hay conteos." /> : null
}
