import { FormMessage } from '@/components/FormMessage'
import { errorMessage } from '@/services/apiError'

interface MutationErrorProps {
  /** Si la operación falló; si no, no se muestra nada. */
  readonly isError: boolean
  readonly error: unknown
  /** El texto cuando el servidor no da un motivo. */
  readonly fallback: string
}

/** El aviso de error de una operación, junto a los datos del formulario. */
export function MutationError({ isError, error, fallback }: MutationErrorProps) {
  if (!isError) {
    return null
  }
  return <FormMessage tone="error">{errorMessage(error, fallback)}</FormMessage>
}
