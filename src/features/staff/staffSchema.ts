import { z } from 'zod'

import type { StaffResponse, UserRole } from '../../api/types'
import {
  correoRule,
  MAX_NOMBRE_COMPLETO,
  nombreRule,
  passwordRule,
} from '../../services/fieldRules'

/** Como se llama cada tipo de cuenta en la interfaz. El servidor manda el mismo texto. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Encargado',
  waiter: 'Mesero',
}

// El orden de la lista: casi siempre se da de alta a un mesero.
export const ROLE_OPTIONS: readonly UserRole[] = ['waiter', 'admin']

const roleRule = z.enum(['admin', 'waiter'], 'Elige el tipo de cuenta')

// El correo no esta aca: se fija al crear la cuenta y el servidor no deja
// cambiarlo, porque es con lo que la persona entra.
export const staffIdentitySchema = z.object({
  full_name: nombreRule('nombre completo', MAX_NOMBRE_COMPLETO, 'el'),
  role: roleRule,
})

export type StaffIdentityValues = z.infer<typeof staffIdentitySchema>

export const createStaffSchema = staffIdentitySchema.extend({
  email: correoRule,
  password: passwordRule,
})

export type CreateStaffValues = z.infer<typeof createStaffSchema>

export const EMPTY_CREATE_STAFF: CreateStaffValues = {
  full_name: '',
  email: '',
  role: 'waiter',
  password: '',
}

export function identityOf(account: StaffResponse): StaffIdentityValues {
  return { full_name: account.full_name, role: account.role }
}

export const resetPasswordSchema = z.object({ new_password: passwordRule })

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
