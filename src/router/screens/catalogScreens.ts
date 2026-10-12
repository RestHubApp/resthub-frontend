import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas de menú, mesas e inventario. */
export const CATALOG_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.menu,
    permission: PERMISSION.menuManage,
    nav: { label: 'Menú', icon: 'menu', description: 'Categorías, platos, precios y lo que hay disponible hoy.' },
    load: asDefault(() => import('@/features/menu/MenuView'), 'MenuView'),
    prefetch: prefetchOf(() => import('@/features/menu/prefetchMenu'), 'prefetchMenu'),
  },
  {
    path: routePatterns.tables,
    permission: PERMISSION.tablesManage,
    nav: { label: 'Mesas', icon: 'table', description: 'Las mesas del salón y cuáles están en uso.' },
    load: asDefault(() => import('@/features/tables/TablesView'), 'TablesView'),
    prefetch: prefetchOf(() => import('@/features/tables/prefetchTables'), 'prefetchTables'),
  },
  {
    path: routePatterns.inventory,
    permission: PERMISSION.inventoryRead,
    nav: { label: 'Inventario', icon: 'inventory', description: 'Insumos, compras, mermas, recetas y stock bajo.' },
    load: asDefault(() => import('@/features/inventory/InventoryView'), 'InventoryView'),
    prefetch: prefetchOf(() => import('@/features/inventory/prefetchInventory'), 'prefetchInventory'),
  },
  { path: routePatterns.recipeEditor, permission: PERMISSION.inventoryRead, load: asDefault(() => import('@/features/inventory/RecipeEditorView'), 'RecipeEditorView') },
]
