import { z } from 'zod'

import { textoOpcional } from '../../../components/formRules'
import type { Customer } from '../../../api/types'

// Los topes repiten los del backend (`orders/domain/orders.py`).
export const MAX_CLIENTE = 80
export const MAX_TELEFONO = 20
export const MAX_DIRECCION = 200
export const MAX_REFERENCIA = 150

export const takeawaySchema = z
  .object({
    mode: z.enum(['takeaway', 'delivery']),
    customer_name: textoOpcional(MAX_CLIENTE),
    phone: textoOpcional(MAX_TELEFONO),
    address: textoOpcional(MAX_DIRECCION),
    reference: textoOpcional(MAX_REFERENCIA),
    customer_id: z.number().int().positive().nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'takeaway') {
      return
    }
    // Sin nombre, teléfono y dirección el repartidor no sabe a quién ni a dónde.
    const faltan: readonly [keyof typeof values, string][] = [
      ['customer_name', 'Escribe el nombre de quien recibe'],
      ['phone', 'Escribe un teléfono para coordinar la entrega'],
      ['address', 'Escribe la dirección de entrega'],
    ]
    for (const [campo, mensaje] of faltan) {
      if (values[campo] === '') {
        ctx.addIssue({ code: 'custom', path: [campo], message: mensaje })
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
}

/** Los datos de un cliente de la libreta, listos para el formulario. */
export function fromCustomer(customer: Customer, mode: TakeawayValues['mode']): TakeawayValues {
  return {
    mode,
    customer_name: customer.name,
    phone: customer.phone,
    address: customer.address,
    reference: customer.reference,
    customer_id: customer.id,
  }
}

/** La dirección de la toma del pedido, con lo necesario en la URL. */
export function newOrderPath(values: TakeawayValues): string {
  const query = new URLSearchParams({ tipo: values.mode === 'delivery' ? 'delivery' : 'llevar' })
  query.set('cliente', values.customer_name)
  if (values.customer_id !== null) {
    query.set('clienteId', String(values.customer_id))
  }
  if (values.mode === 'delivery') {
    query.set('telefono', values.phone)
    query.set('direccion', values.address)
    query.set('referencia', values.reference)
  }
  return `/pedidos/nuevo?${query.toString()}`
}
