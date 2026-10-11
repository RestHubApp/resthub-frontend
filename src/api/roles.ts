import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type { PermissionCode, PermissionInfo, Role, RoleRequest } from './types'

// Los roles del restaurante y el catálogo de permisos con que se arman.

export const rolesQueryKey = ['roles'] as const
const permissionsQueryKey = ['permissions'] as const

/** Encargado, mesero y los personalizados por nombre, en ese orden. */
async function fetchRoles(): Promise<Role[]> {
  return send((client) => client.GET('/api/v1/roles'))
}

/** La consulta de los roles, la misma para Personal, Roles y la precarga. */
export function rolesQuery() {
  return queryOptions({ queryKey: rolesQueryKey, queryFn: fetchRoles })
}

/** Cada permiso con su nombre en la interfaz y su grupo, ya ordenados. */
async function fetchPermissions(): Promise<PermissionInfo[]> {
  return send((client) => client.GET('/api/v1/permissions'))
}

export function permissionsQuery() {
  // El catálogo cambia con una versión nueva del servidor, no mientras se usa.
  return queryOptions({ queryKey: permissionsQueryKey, queryFn: fetchPermissions, staleTime: Infinity })
}

export async function createRole(payload: RoleRequest): Promise<Role> {
  return send((client) => client.POST('/api/v1/roles', { body: payload }))
}

export async function updateRole(roleId: number, payload: RoleRequest): Promise<Role> {
  return send((client) =>
    client.PUT('/api/v1/roles/{role_id}', { params: { path: { role_id: roleId } }, body: payload }),
  )
}

export async function deleteRole(roleId: number): Promise<void> {
  await send((client) => client.DELETE('/api/v1/roles/{role_id}', { params: { path: { role_id: roleId } } }))
}

/**
 * Si una cuenta con los permisos `granted` puede dar este rol.
 *
 * Nadie reparte lo que no tiene: el servidor rechaza con 403 asignar un rol,
 * o armarlo, con un permiso que falta entre los de quien lo pide.
 */
export function canAssignRole(
  role: Pick<Role, 'permissions'>,
  granted: readonly PermissionCode[],
): boolean {
  const owned = new Set(granted)
  return role.permissions.every((permission) => owned.has(permission))
}
