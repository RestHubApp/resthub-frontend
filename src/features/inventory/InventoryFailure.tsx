import { FormMessage } from '@/components/FormMessage'
import { inventoryErrorMessage } from './inventoryErrors'

interface InventoryFailureProps {
  /** Lo que se guardó: si falló y por qué. */
  readonly mutation: { readonly isError: boolean; readonly error: unknown }
  /** El texto cuando el error no es uno conocido ni trae motivo. */
  readonly fallback: string
}

/** El error de guardar algo del inventario, explicado por su código. */
export function InventoryFailure({ mutation, fallback }: InventoryFailureProps) {
  if (!mutation.isError) {
    return null
  }
  return <FormMessage tone="error">{inventoryErrorMessage(mutation.error, fallback)}</FormMessage>
}
