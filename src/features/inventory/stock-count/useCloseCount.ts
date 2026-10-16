import { inventoryQueryKey } from '@/api/inventory'
import type { StockCount } from '@/api/types'
import { useStockCountChange } from './useStockCountChange'

/**
 * Cerrar el conteo: el servidor ajusta el stock de lo contado, así que el
 * inventario entero (insumos, alertas, libro) se relee de fondo. La pantalla
 * pasa sola al reporte de diferencias, porque el conteo vuelve cerrado.
 */
export function useCloseCount(countId: number, send: () => Promise<StockCount>) {
  return useStockCountChange(countId, {
    send,
    success: (closed) => `Conteo #${String(closed.number)} cerrado. El stock quedó ajustado a lo contado.`,
    invalidate: [inventoryQueryKey],
  })
}
