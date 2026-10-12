import { PERMISSION } from '@/api/permissions'
import { permissionsQuery, rolesQuery } from '@/api/roles'
import { prefetch } from '@/services/queryClient'
import { can } from '@/store/session'

/** Roles y permisos: los roles y el catálogo con que se arman. */
export function prefetchRoles(): void {
  if (can(PERMISSION.rolesManage)) {
    prefetch(rolesQuery())
    prefetch(permissionsQuery())
  }
}
