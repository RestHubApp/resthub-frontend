import { z } from 'zod'

import type { PermissionCode, Role, RoleRequest } from '../../api/types'

// El mismo tope que el servidor.
export const MAX_ROLE_NAME = 40

export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre del rol')
    .max(MAX_ROLE_NAME, `Usa como máximo ${String(MAX_ROLE_NAME)} caracteres`),
  // Los códigos salen del catálogo del servidor, que es quien los valida.
  permissions: z.array(z.custom<PermissionCode>((valor) => typeof valor === 'string')),
})

export type RoleValues = z.infer<typeof roleSchema>

/** Lo que muestra el formulario: el rol a editar o uno nuevo, vacío. */
export function valuesOf(role: Role | null): RoleValues {
  return role === null ? { name: '', permissions: [] } : { name: role.name, permissions: [...role.permissions] }
}

/** El mesero conserva su nombre: el servidor responde 409 si cambia. */
export function rolePayload(values: RoleValues, role: Role | null): RoleRequest {
  return {
    name: role?.kind === 'waiter' ? role.name : values.name,
    permissions: values.permissions,
  }
}
