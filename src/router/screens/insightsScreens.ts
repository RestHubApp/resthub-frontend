import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import * as icons from '@/components/icons'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas del análisis del negocio: el resumen, la reposición y la auditoría de la IA. */
export const INSIGHTS_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.insights,
    permission: PERMISSION.insightsRead,
    nav: {
      label: 'Resumen',
      icon: icons.indicators,
      description: 'Ventas, platos más vendidos, márgenes y la predicción de demanda.',
    },
    load: asDefault(() => import('@/features/insights/InsightsView'), 'InsightsView'),
    prefetch: prefetchOf(() => import('@/features/insights/prefetchInsights'), 'prefetchInsights'),
  },
  { path: routePatterns.restock, permission: PERMISSION.insightsRead, load: asDefault(() => import('@/features/insights/RestockView'), 'RestockView') },
  { path: routePatterns.aiAudit, permission: PERMISSION.insightsRead, load: asDefault(() => import('@/features/insights/AiAuditView'), 'AiAuditView') },
]
