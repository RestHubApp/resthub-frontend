import { z } from 'zod'

import { phoneOptional, textOptional } from '@/components/formRules'
import type { Customer } from '@/api/types'
import { paths } from '@/services/paths'

// Los topes repiten los del backend (`orders/domain/orders.py`).
export const MAX_CUSTOMER = 80
export const MAX_PHONE = 20
export const MAX_ADDRESS = 200
export const MAX_REFERENCE = 150

export const takeawaySchema = z
  .object({
    mode: z.enum(['takeaway', 'delivery']),
    customer_name: textOptional(MAX_CUSTOMER),
    phone: phoneOptional(MAX_PHONE),
    address: textOptional(MAX_ADDRESS),
    reference: textOptional(MAX_REFERENCE),
    customer_id: z.number().int().positive().nullable(),
    // El cliente nuevo de un delivery aceptó quedar en la libreta (Ley N.º 29733).
    consent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'takeaway') {
      return
    }
    // Sin nombre, teléfono y dirección el repartidor no sabe a quién ni a dónde.
    const missing: readonly [keyof typeof values, string][] = [
      ['customer_name', 'Escribe el nombre de quien recibe'],
      ['phone', 'Escribe un teléfono para coordinar la entrega'],
      ['address', 'Escribe la dirección de entrega'],
    ]
    for (const [field, message] of missing) {
      // El teléfono de un cliente de la libreta lo completa el servidor si queda vacío.
      const isFromNotebook = field === 'phone' && values.customer_id !== null
      if (values[field] === '' && !isFromNotebook) {
        ctx.addIssue({ code: 'custom', path: [field], message })
      }
    }
  })

export type TakeawayValues = z.infer<typeof takeawaySchema>

export const EMPTY_TAKEAWAY: TakeawayValues = {
  mode: 'takeaway',
  customer_name: '',
  phone: '',
  address: '',
  reference: '',
  customer_id: null,
  consent: false,
}

/**
 * Los datos de un cliente de la libreta, listos para el formulario. Quien no
 * gestiona clientes los recibe enmascarados («987•••321»): ese teléfono no se
 * copia, el pedido sale con el de la libreta (lo completa el servidor).
 */
export function fromCustomer(customer: Customer, mode: TakeawayValues['mode']): TakeawayValues {
  return {
    mode,
    customer_name: customer.name,
    phone: customer.masked ? '' : customer.phone,
    address: customer.address,
    reference: customer.reference,
    customer_id: customer.id,
    consent: false,
  }
}

/** La dirección de la toma del pedido, con lo necesario en la URL. */
export function newOrderPath(values: TakeawayValues): string {
  const query = new URLSearchParams({ 'tipo': values.mode === 'delivery' ? 'delivery' : 'llevar' })
  query.set('cliente', values.customer_name)
  if (values.customer_id !== null) {
    query.set('clienteId', String(values.customer_id))
  }
  if (values.mode === 'delivery') {
    query.set('telefono', values.phone)
    query.set('direccion', values.address)
    query.set('referencia', values.reference)
  }
  return paths.orders.newWithQuery(query)
}
