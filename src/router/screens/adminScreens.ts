import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas de personal, roles y análisis. */
export const ADMIN_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.staff,
    permission: PERMISSION.staffManage,
    nav: { label: 'Personal', icon: 'staff', description: 'Las cuentas del restaurante y el rol de cada una.' },
    load: asDefault(() => import('@/features/staff/StaffView'), 'StaffView'),
    prefetch: prefetchOf(() => import('@/features/staff/prefetchStaff'), 'prefetchStaff'),
  },
  {
    path: routePatterns.roles,
    permission: PERMISSION.rolesManage,
    nav: {
      label: 'Roles',
      icon: 'roles',
      description: 'Qué puede hacer cada rol del restaurante: encargado, mesero y los que armes.',
    },
    load: asDefault(() => import('@/features/roles/RolesView'), 'RolesView'),
    prefetch: prefetchOf(() => import('@/features/roles/prefetchRoles'), 'prefetchRoles'),
  },
  {
    path: routePatterns.insights,
    permission: PERMISSION.insightsRead,
    nav: {
      label: 'Resumen',
      icon: 'indicators',
      description: 'Ventas, platos más vendidos, márgenes y la predicción de demanda.',
    },
    load: asDefault(() => import('@/features/insights/InsightsView'), 'InsightsView'),
    prefetch: prefetchOf(() => import('@/features/insights/prefetchInsights'), 'prefetchInsights'),
  },
  { path: routePatterns.restock, permission: PERMISSION.insightsRead, load: asDefault(() => import('@/features/insights/RestockView'), 'RestockView') },
  { path: routePatterns.aiAudit, permission: PERMISSION.insightsRead, load: asDefault(() => import('@/features/insights/AiAuditView'), 'AiAuditView') },
]
