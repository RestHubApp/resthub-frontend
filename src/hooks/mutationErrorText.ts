import { errorMessage } from '@/services/api'

/**
 * El texto de error de una mutación fallida, o `null` si no falló: el mensaje
 * que trae el servidor y, si no trae uno, el de respaldo.
 */
export function mutationErrorText(mutation: { readonly isError: boolean; readonly error: unknown }, fallback: string): string | null {
  return mutation.isError ? errorMessage(mutation.error, fallback) : null
}
