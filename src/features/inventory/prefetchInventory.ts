import { ingredientsQuery, lowStockQuery } from '../../api/inventory'
import { prefetch } from '../../services/queryClient'
import { can } from '../../store/session'

/** Inventario: los insumos de la tabla y las alertas del resumen de arriba. */
export function prefetchInventory(): void {
  if (!can('inventory.read')) {
    return
  }
  prefetch(ingredientsQuery)
  prefetch(lowStockQuery)
}
