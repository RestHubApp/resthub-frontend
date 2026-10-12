import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import { routePatterns } from '@/services/paths'
import type { Screen } from './screenTypes'

/** La bitácora del restaurante: quién hizo qué y quién abrió datos de clientes. */
export const AUDIT_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.activityLog,
    permission: PERMISSION.activityRead,
    nav: {
      label: 'Bitácora',
      icon: 'history',
      description: 'Quién hizo qué en el restaurante, y quién abrió los datos de los clientes.',
    },
    load: asDefault(() => import('@/features/activity/ActivityLogView'), 'ActivityLogView'),
  },
]
