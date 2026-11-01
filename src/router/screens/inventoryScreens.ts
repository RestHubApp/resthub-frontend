import { PERMISSION } from '@/api/permissions'
import { asDefault, lazyNamed } from '@/components/lazyNamed'
import * as icons from '@/components/icons'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas del inventario: insumos, recetas, conteos físicos y las mermas por aprobar. */
export const INVENTORY_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.inventory,
    permission: PERMISSION.inventoryRead,
    nav: { label: 'Inventario', icon: icons.inventory, description: 'Insumos, compras, mermas, recetas y stock bajo.' },
    load: asDefault(() => import('@/features/inventory/InventoryView'), 'InventoryView'),
    prefetch: prefetchOf(() => import('@/features/inventory/prefetchInventory'), 'prefetchInventory'),
  },
  { path: routePatterns.recipeEditor, permission: PERMISSION.inventoryRead, load: asDefault(() => import('@/features/inventory/RecipeEditorView'), 'RecipeEditorView') },
  {
    path: routePatterns.wasteApprovals,
    permission: PERMISSION.inventoryApproveWaste,
    nav: {
      label: 'Mermas por aprobar',
      icon: icons.correct,
      description: 'Las mermas grandes que esperan tu visto bueno antes de bajar el stock.',
      badge: lazyNamed(() => import('@/features/inventory/waste-approvals/WasteApprovalsBadge'), 'WasteApprovalsBadge'),
    },
    load: asDefault(() => import('@/features/inventory/waste-approvals/WasteApprovalsView'), 'WasteApprovalsView'),
  },
  { path: routePatterns.stockCount, permission: PERMISSION.inventoryRead, load: asDefault(() => import('@/features/inventory/stock-count/StockCountView'), 'StockCountView') },
]
