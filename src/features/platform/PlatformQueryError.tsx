import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'

interface PlatformQueryErrorProps {
  readonly error: unknown
  readonly fallback: string
  readonly onRetry: () => void
}

/** Una lectura que falló, con lo que dijo el servidor y cómo volver a intentarlo. */
export default function PlatformQueryError({ error, fallback, onRetry }: PlatformQueryErrorProps) {
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
