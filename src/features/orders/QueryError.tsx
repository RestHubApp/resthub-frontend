import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'

interface QueryErrorProps {
  readonly error: unknown
  readonly fallback: string
  readonly onRetry: () => void
}

/** Una lectura que fallo, con lo que dijo el servidor y como volver a intentarlo. */
export default function QueryError({ error, fallback, onRetry }: QueryErrorProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <FormMessage tone="error">{errorMessage(error, fallback)}</FormMessage>
      <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onRetry}>
        <Icon name="reintentar" size={16} />
        <span>Reintentar</span>
      </Button>
    </div>
  )
}
