import { createRole, updateRole } from '@/api/roles'
import type { Role } from '@/api/types'
import { withRole } from './roleCache'
import { rolePayload, type RoleValues } from './roleSchema'
import { useRoleMutation } from './useRoleMutation'

/** El texto cuando el servidor no explica por qué no se guardó el rol. */
export const ROLE_SAVE_FAILURE = 'No se pudo guardar el rol.'

/**
 * La mutación del formulario de rol: crea el rol si `role` es `null` y, si no,
 * lo actualiza. El error se muestra dentro del formulario.
 */
export function useRoleSave(role: Role | null, onDone: () => void) {
  return useRoleMutation({
    mutationFn: (values: RoleValues) => {
      const payload = rolePayload(values, role)
      return role === null ? createRole(payload) : updateRole(role.id, payload)
    },
    roleId: role?.id,
    failure: ROLE_SAVE_FAILURE,
    success: (saved) => (role === null ? `Rol ${saved.name} creado.` : `Rol ${saved.name} guardado.`),
    updateCache: withRole,
    onSuccess: onDone,
    inlineError: true,
  })
}
