import { saveCustomer } from '../../../api/customers'
import type { TakeawayValues } from './takeawaySchema'

// Guardar al cliente es un extra: con la señal lenta no se espera más que esto
// para ir a la toma del pedido.
const CUSTOMER_TIMEOUT_MS = 4000

/**
 * Un delivery a alguien que no está en la libreta lo agrega, así la próxima
 * vez no dicta su dirección. Si ya estaba (mismo teléfono), no hay señal o el
 * servidor tarda, se sigue igual: el servidor lo reconoce por el teléfono al
 * abrir el pedido.
 */
export async function withCustomer(values: TakeawayValues): Promise<TakeawayValues> {
  if (values.mode !== 'delivery' || values.customer_id !== null || values.phone === '' || !navigator.onLine) {
    return values
  }
  try {
    const nuevo = await saveCustomer(
      {
        name: values.customer_name,
        phone: values.phone,
        email: '',
        address: values.address,
        reference: values.reference,
        notes: '',
      },
      undefined,
      { timeout: CUSTOMER_TIMEOUT_MS },
    )
    return { ...values, customer_id: nuevo.id }
  } catch {
    return values
  }
}
