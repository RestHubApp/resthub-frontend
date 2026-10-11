import { z } from 'zod'

import type { Customer, CustomerRequest } from '@/api/types'
import { textoOpcional } from '@/components/formRules'

// Los topes repiten los del backend (`customers/domain/customers.py`).
export const LIMITS = { name: 80, phone: 20, email: 120, address: 200, reference: 150, notes: 300 } as const

const fields = {
  name: z.string().trim().min(1, 'Escribe el nombre').max(LIMITS.name, `Usa como máximo ${String(LIMITS.name)} caracteres`),
  phone: textoOpcional(LIMITS.phone),
  email: textoOpcional(LIMITS.email).refine(
    (value) => value === '' || z.email().safeParse(value).success,
    'Escribe un correo válido',
  ),
  address: textoOpcional(LIMITS.address),
  reference: textoOpcional(LIMITS.reference),
  notes: textoOpcional(LIMITS.notes),
  consent: z.boolean(),
}

/**
 * El alta exige el consentimiento del cliente (Ley N.º 29733). Editar a uno
 * guardado antes de pedirlo no lo exige, pero la casilla sigue ahí para
 * anotarlo si ahora acepta.
 */
export function customerSchema(needsConsent: boolean) {
  return z.object(fields).refine((values) => !needsConsent || values.consent, {
    path: ['consent'],
    message: 'Sin su consentimiento no se puede guardar al cliente en la libreta.',
  })
}

export type CustomerValues = z.infer<ReturnType<typeof customerSchema>>

const EMPTY: CustomerValues = { name: '', phone: '', email: '', address: '', reference: '', notes: '', consent: false }

export function customerDefaults(customer: Customer | null): CustomerValues {
  if (customer === null) {
    return EMPTY
  }
  const { name, phone, email, address, reference, notes } = customer
  return { name, phone, email, address, reference, notes, consent: false }
}

export function customerRequest(values: CustomerValues): CustomerRequest {
  return { ...values }
}
