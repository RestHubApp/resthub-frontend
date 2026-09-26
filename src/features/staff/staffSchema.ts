import { z } from 'zod'

import type { CreateStaffRequest, StaffResponse, UpdateStaffRequest } from '../../api/types'
import {
  correoRule,
  MAX_NOMBRE_COMPLETO,
  nombreRule,
  passwordRule,
} from '../../services/fieldRules'

// La lista nativa entrega texto: el rol pasa a numero recien al enviarlo.
const roleRule = z.string().regex(/^\d+$/u, 'Elige el rol')

// El correo no esta aca: se fija al crear la cuenta y el servidor no deja
// cambiarlo, porque es con lo que la persona entra.
export const staffIdentitySchema = z.object({
  full_name: nombreRule('nombre completo', MAX_NOMBRE_COMPLETO, 'el'),
  role_id: roleRule,
})

export type StaffIdentityValues = z.infer<typeof staffIdentitySchema>

export const createStaffSchema = staffIdentitySchema.extend({
  email: correoRule,
  password: passwordRule,
})

export type CreateStaffValues = z.infer<typeof createStaffSchema>

/** Un alta en blanco, con el rol que ya viene elegido si lo hay. */
export function emptyCreateStaff(roleId: number | undefined): CreateStaffValues {
  return {
    full_name: '',
    email: '',
    role_id: roleId === undefined ? '' : String(roleId),
    password: '',
  }
}

export function identityOf(account: StaffResponse): StaffIdentityValues {
  return { full_name: account.full_name, role_id: String(account.role_id) }
}

export function createPayload(values: CreateStaffValues): CreateStaffRequest {
  return { ...values, role_id: Number(values.role_id) }
}

export function identityPayload(values: StaffIdentityValues): UpdateStaffRequest {
  return { full_name: values.full_name, role_id: Number(values.role_id) }
}

export const resetPasswordSchema = z.object({ new_password: passwordRule })

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
