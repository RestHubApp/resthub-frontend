import { saveCustomer } from '../../../api/customers'
import type { TakeawayValues } from './takeawaySchema'

// Guardar al cliente es un extra: con la señal lenta no se espera más que esto
// para ir a la toma del pedido.
const CUSTOMER_TIMEOUT_MS = 4000

/**
 * Un delivery a alguien que no está en la libreta lo agrega, así la próxima
 * vez no dicta su dirección. Si el alta falla, el error sube: el diálogo sigue
 * abierto con los datos y se puede volver a intentar. Sin red ni se intenta.
 */
export async function withCustomer(values: TakeawayValues): Promise<TakeawayValues> {
  if (values.mode !== 'delivery' || values.customer_id !== null || values.phone === '' || !navigator.onLine) {
    return values
  }
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
}
