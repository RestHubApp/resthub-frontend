import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { errorMessage } from '@/services/apiError'
import { MenuSkeleton } from './MenuSkeleton'

interface MenuStatusProps {
  readonly isPending: boolean
  /** El error de la carga, o `null` si no falló. */
  readonly error: Error | null
  /** La carga terminó y no hay categorías. */
  readonly isEmpty: boolean
}

/** Lo que se ve en lugar de la carta: cargando, error o carta vacía. */
export function MenuStatus({ isPending, error, isEmpty }: MenuStatusProps) {
  return (
    <>
      {isPending ? <MenuSkeleton /> : null}
      {error === null ? null : (
        <FormMessage tone="error">
          {errorMessage(error, 'No se pudo cargar la carta.')}
        </FormMessage>
      )}
      {isEmpty ? (
        <EmptyState
          title="La carta está vacía"
          description="Empieza por una categoría, como Entradas o Bebidas, y agrégale sus platos."
        />
      ) : null}
    </>
  )
}
