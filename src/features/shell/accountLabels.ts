import type { Session } from '@/api/types'
import { SYSTEM_ADMINISTRATION } from '@/services/systemAdministration'

/** Lo que el armazón escribe de una cuenta: dónde trabaja y quién es. */
export interface AccountLabels {
  readonly fullName: string
  readonly roleLabel: string
}

/** El nombre y el rol de la cuenta, para el pie del menú. */
export function accountLabels(account: Session): AccountLabels {
  if (account.kind === 'platform') {
    return { fullName: account.admin.full_name, roleLabel: 'Administrador del sistema' }
  }
  return { fullName: account.user.full_name, roleLabel: account.user.role_label }
}

/** El nombre de lo que la cuenta administra: su restaurante o el sistema entero. */
export function scopeName(account: Session): string {
  return account.kind === 'platform' ? SYSTEM_ADMINISTRATION : account.restaurant.name
}

/** Lo que el lector de pantalla dice antes del nombre de arriba; la administración del sistema no lleva prefijo. */
export function spokenScope(account: Session): string | undefined {
  return account.kind === 'staff' ? 'Restaurante' : undefined
}
