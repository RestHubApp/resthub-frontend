import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { errorMessage } from '@/services/api'

interface InvoiceListStatusProps {
  readonly isPending: boolean
  readonly isError: boolean
  readonly isEmpty: boolean
  readonly error: unknown
  readonly onRetry: () => void
}

/** El estado de la lista de comprobantes: cargando, con error o vacía. */
export function InvoiceListStatus({ isPending, isError, isEmpty, error, onRetry }: InvoiceListStatusProps) {
  return (
    <>
      {isPending ? <ListSkeleton label="Cargando comprobantes…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {isError ? <RetryQueryError message={errorMessage(error, 'No se pudieron cargar los comprobantes.')} onRetry={onRetry} /> : null}
      {isEmpty ? <EmptyState title="Todavía no se emitió ningún comprobante" /> : null}
    </>
  )
}
