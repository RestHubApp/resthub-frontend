import { saveCustomer } from '../../../api/customers'
import { errorStatus } from '../../../services/api'
import type { TakeawayValues } from './takeawaySchema'

// Guardar al cliente es un extra: con la señal lenta no se espera más que esto
// para ir a la toma del pedido.
const CUSTOMER_TIMEOUT_MS = 4000
// El teléfono ya es de alguien de la libreta.
const PHONE_TAKEN = 409

/**
 * Un delivery a alguien que no está en la libreta lo agrega, así la próxima
 * vez no dicta su dirección. Si el teléfono ya estaba en la libreta (409), se
 * sigue sin el alta: el servidor reconoce al cliente por el teléfono al abrir el
 * pedido. Cualquier otro fallo sube: el diálogo sigue abierto con los datos y se
 * puede volver a intentar. Sin red ni se intenta.
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
  } catch (error) {
    if (errorStatus(error) === PHONE_TAKEN) {
      return values
    }
    throw error
  }
}
