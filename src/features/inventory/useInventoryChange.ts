import { useMutation, useQueryClient } from '@tanstack/react-query'

import { inventoryQueryKey } from '../../api/inventory'
import { useNotifications } from '../../store/notifications'

interface InventoryChange<TVars, TResult> {
  readonly send: (vars: TVars) => Promise<TResult>
  /** El aviso de éxito, armado con lo que devolvió el servidor. */
  readonly success: (result: TResult) => string
  readonly onDone: () => void
}

/**
 * Registrar algo en el inventario y refrescar lo que depende de ello.
 *
 * Una compra cambia el stock, las alertas, el libro y quizá el costo de las
 * recetas: se invalida el inventario entero, que es poco y se lee rápido. El
 * error no se avisa acá: lo muestra el formulario, junto a los datos.
 */
export function useInventoryChange<TVars, TResult>({
  send,
  success,
  onDone,
}: InventoryChange<TVars, TResult>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: send,
    onSuccess: async (resultado) => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey })
      push({ tone: 'info', message: success(resultado) })
      onDone()
    },
  })
}
