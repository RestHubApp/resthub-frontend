import { canAssignRole } from '../../api/roles'
import type { PermissionCode, Role, StaffResponse } from '../../api/types'

/**
 * Los roles que se ofrecen al crear o editar una cuenta.
 *
 * Solo los que quien mira puede dar; el servidor rechazaría los demás con 403.
 * Al editar entra también el rol que la cuenta ya tiene, para que la lista
 * muestre lo que hay.
 */
export function roleOptions(
  roles: readonly Role[],
  granted: readonly PermissionCode[],
  currentRoleId?: number,
): Role[] {
  return roles.filter((role) => role.id === currentRoleId || canAssignRole(role, granted))
}

/** El rol que viene elegido en el alta: casi siempre se da de alta a un mesero. */
export function defaultRoleId(options: readonly Role[]): number | undefined {
  return (options.find((role) => role.kind === 'waiter') ?? options.at(0))?.id
}

/**
 * Si quien mira puede editar la cuenta, restablecer su contraseña o activarla.
 *
 * El servidor lo rechaza cuando el rol de la cuenta tiene permisos que quien
 * mira no tiene. Sin la lista de roles todavía, se ofrece y decide el servidor.
 */
export function canManageAccount(
  account: Pick<StaffResponse, 'role_id'>,
  roles: readonly Role[] | undefined,
  granted: readonly PermissionCode[],
): boolean {
  const role = roles?.find((candidate) => candidate.id === account.role_id)
  return role === undefined || canAssignRole(role, granted)
}
