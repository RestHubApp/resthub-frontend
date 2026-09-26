import { canAssignRole } from '../../api/roles'
import type { PermissionCode, Role } from '../../api/types'

/**
 * Qué puede hacer quien mira con un rol.
 *
 * `edit`: cambiarlo. `fixed`: el del encargado, que no se cambia. `beyond`:
 * tiene permisos que quien mira no tiene, y el servidor rechazaría el cambio.
 */
export type RoleAccess = 'edit' | 'fixed' | 'beyond'

export function roleAccess(role: Role, granted: readonly PermissionCode[]): RoleAccess {
  if (!role.is_editable) {
    return 'fixed'
  }
  return canAssignRole(role, granted) ? 'edit' : 'beyond'
}
