import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import * as icons from '@/components/icons'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas de menú y mesas. */
export const CATALOG_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.menu,
    permission: PERMISSION.menuManage,
    nav: { label: 'Menú', icon: icons.dishMenu, description: 'Categorías, platos, precios y lo que hay disponible hoy.' },
    load: asDefault(() => import('@/features/menu/MenuView'), 'MenuView'),
    prefetch: prefetchOf(() => import('@/features/menu/prefetchMenu'), 'prefetchMenu'),
  },
  {
    path: routePatterns.tables,
    permission: PERMISSION.tablesManage,
    nav: { label: 'Mesas', icon: icons.table, description: 'Las mesas del salón y cuáles están en uso.' },
    load: asDefault(() => import('@/features/tables/TablesView'), 'TablesView'),
    prefetch: prefetchOf(() => import('@/features/tables/prefetchTables'), 'prefetchTables'),
  },
]
