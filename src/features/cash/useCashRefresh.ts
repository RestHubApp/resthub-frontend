import { useQueryClient } from '@tanstack/react-query'

import { cashQueryKey } from '@/api/cash'
import { useServerEvent } from '@/hooks/useServerEvent'

/**
 * Mantiene la caja al día: cada cobro de un mesero avisa por el canal de
 * pedidos, y abrir o cerrar la caja, por el de caja. Devuelve la función que
 * relee la caja, para usarla también tras una acción propia.
 */
export function useCashRefresh(): () => void {
  const queryClient = useQueryClient()
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: cashQueryKey })
  }
  useServerEvent('orders', refresh)
  useServerEvent('cash', refresh)
  return refresh
}
