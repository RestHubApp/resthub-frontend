import { FormMessage } from './FormMessage'
import { errorMessage } from '@/services/apiError'

interface ErrorMessageProps {
  /** El error del servidor: se muestra lo que dijo. */
  readonly error: unknown
  /** El texto cuando el servidor no da un motivo. */
  readonly fallback: string
  /** Si la operación falló; con `false` no se muestra nada. Por omisión, falló. */
  readonly isError?: boolean
  /** Un aviso de respaldo del armazón (ver `FormMessage`). */
  readonly isFallbackNotice?: boolean
}

/**
 * El aviso de error de una lectura o de una operación: lo que dijo el servidor
 * o, si no dijo nada, el texto de respaldo. Es el único lugar donde se junta
 * `errorMessage` con `FormMessage`.
 */
export function ErrorMessage({ error, fallback, isError = true, isFallbackNotice = false }: ErrorMessageProps) {
  if (!isError) {
    return null
  }
  return <FormMessage tone="error" fallback={isFallbackNotice}>{errorMessage(error, fallback)}</FormMessage>
}
