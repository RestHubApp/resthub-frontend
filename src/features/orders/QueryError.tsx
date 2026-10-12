import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/apiError'

interface QueryErrorProps {
  readonly error: unknown
  readonly fallback: string
  readonly onRetry: () => void
}

/** Una lectura que fallo, con lo que dijo el servidor y como volver a intentarlo. */
export function QueryError({ error, fallback, onRetry }: QueryErrorProps) {
  return (
    // `data-reintento`: esta falla ya ofrece reintentar (ver `ApiFailureNotice`).
    <div className="flex flex-col items-start gap-3" data-reintento="">
      <FormMessage tone="error">{errorMessage(error, fallback)}</FormMessage>
      <Button type="button" variant="outline" onClick={onRetry}>
        <Icon name="retry" size={16} />
        <span>Reintentar</span>
      </Button>
    </div>
  )
}
