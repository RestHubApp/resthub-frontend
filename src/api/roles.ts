import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type { PermissionCode, PermissionInfo, Role, RoleRequest } from './types'

// Los roles del restaurante y el catálogo de permisos con que se arman.

export const rolesQueryKey = ['roles'] as const
export const permissionsQueryKey = ['permissions'] as const

function rolePath(roleId: number): string {
  return `/roles/${String(roleId)}`
}

/** Encargado, mesero y los personalizados por nombre, en ese orden. */
export async function fetchRoles(): Promise<Role[]> {
  const { data } = await api.get<Role[]>('/roles')
  return data
}

/** La consulta de los roles, la misma para Personal, Roles y la precarga. */
export function rolesQuery() {
  return queryOptions({ queryKey: rolesQueryKey, queryFn: fetchRoles })
}

/** Cada permiso con su nombre en la interfaz y su grupo, ya ordenados. */
export async function fetchPermissions(): Promise<PermissionInfo[]> {
  const { data } = await api.get<PermissionInfo[]>('/permissions')
  return data
}

export function permissionsQuery() {
  // El catálogo cambia con una versión nueva del servidor, no mientras se usa.
  return queryOptions({ queryKey: permissionsQueryKey, queryFn: fetchPermissions, staleTime: Infinity })
}

export async function createRole(payload: RoleRequest): Promise<Role> {
  const { data } = await api.post<Role>('/roles', payload)
  return data
}

export async function updateRole(roleId: number, payload: RoleRequest): Promise<Role> {
  const { data } = await api.put<Role>(rolePath(roleId), payload)
  return data
}

export async function deleteRole(roleId: number): Promise<void> {
  await api.delete(rolePath(roleId))
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
  return role.permissions.every((permission) => granted.includes(permission))
}
