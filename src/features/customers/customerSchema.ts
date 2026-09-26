import { z } from 'zod'

import type { Customer, CustomerRequest } from '../../api/types'
import { textoOpcional } from '../../components/formRules'

// Los topes repiten los del backend (`customers/domain/customers.py`).
export const LIMITES = { name: 80, phone: 20, email: 120, address: 200, reference: 150, notes: 300 } as const

export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre').max(LIMITES.name, `Usa como máximo ${String(LIMITES.name)} caracteres`),
  phone: textoOpcional(LIMITES.phone),
  email: textoOpcional(LIMITES.email).refine(
    (valor) => valor === '' || z.email().safeParse(valor).success,
    'Escribe un correo válido',
  ),
  address: textoOpcional(LIMITES.address),
  reference: textoOpcional(LIMITES.reference),
  notes: textoOpcional(LIMITES.notes),
})

export type CustomerValues = z.infer<typeof customerSchema>

const EMPTY: CustomerValues = { name: '', phone: '', email: '', address: '', reference: '', notes: '' }

export function customerDefaults(customer: Customer | null): CustomerValues {
  if (customer === null) {
    return EMPTY
  }
  const { name, phone, email, address, reference, notes } = customer
  return { name, phone, email, address, reference, notes }
}

export function customerRequest(values: CustomerValues): CustomerRequest {
  return { ...values }
}
