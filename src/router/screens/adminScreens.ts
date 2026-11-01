import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import * as icons from '@/components/icons'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas de personal y roles. */
export const ADMIN_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.staff,
    permission: PERMISSION.staffManage,
    nav: { label: 'Personal', icon: icons.staff, description: 'Las cuentas del restaurante y el rol de cada una.' },
    load: asDefault(() => import('@/features/staff/StaffView'), 'StaffView'),
    prefetch: prefetchOf(() => import('@/features/staff/prefetchStaff'), 'prefetchStaff'),
  },
  {
    path: routePatterns.roles,
    permission: PERMISSION.rolesManage,
    nav: {
      label: 'Roles',
      icon: icons.roles,
      description: 'Qué puede hacer cada rol del restaurante: encargado, mesero y los que armes.',
    },
    load: asDefault(() => import('@/features/roles/RolesView'), 'RolesView'),
    prefetch: prefetchOf(() => import('@/features/roles/prefetchRoles'), 'prefetchRoles'),
  },
]
