import FormMessage from './FormMessage'
import { Button } from './ui/button'

interface RetryQueryErrorProps {
  readonly message: string
  readonly onRetry: () => void
  /** El aviso de respaldo del armazón (ver `ApiFailureNotice`). */
  readonly fallback?: boolean
}

/** Un error de lectura con una acción explícita para repetirla al recuperar señal. */
export default function RetryQueryError({ message, onRetry, fallback = false }: RetryQueryErrorProps) {
  return (
    // `data-reintento`: esta falla ya ofrece reintentar (ver `ApiFailureNotice`).
    <div className="flex flex-col items-start gap-3" data-reintento={fallback ? undefined : ''}>
      <FormMessage tone="error" fallback={fallback}>{message}</FormMessage>
      <Button type="button" variant="outline" onClick={onRetry}>Reintentar</Button>
    </div>
  )
}
