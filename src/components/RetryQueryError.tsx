import { ErrorMessage } from './ErrorMessage'
import { Icon } from './Icon'
import { Button } from './ui/button'

interface RetryQueryErrorProps {
  /** El error de la lectura: se muestra lo que dijo el servidor. */
  readonly error: unknown
  /** El texto cuando el servidor no da un motivo. */
  readonly fallback: string
  readonly onRetry: () => void
  /** El aviso de respaldo del armazón (ver `ApiFailureNotice`). */
  readonly isFallbackNotice?: boolean
}

/** Una lectura que falló, con lo que dijo el servidor y cómo volver a intentarla. */
export function RetryQueryError({ error, fallback, onRetry, isFallbackNotice = false }: RetryQueryErrorProps) {
  return (
    // `data-reintento`: esta falla ya ofrece reintentar (ver `ApiFailureNotice`).
    <div className="flex flex-col items-start gap-3" data-testid="retry-query-error" data-reintento={isFallbackNotice ? undefined : ''}>
      <ErrorMessage error={error} fallback={fallback} isFallbackNotice={isFallbackNotice} />
      <Button type="button" variant="outline" onClick={onRetry}>
        <Icon name="retry" size={16} />
        <span>Reintentar</span>
      </Button>
    </div>
  )
}
