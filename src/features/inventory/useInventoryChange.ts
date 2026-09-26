import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useNotifications } from '../../store/notifications'
import { type IngredientResult, saveIngredient } from './ingredientCache'

interface InventoryChange<TVars, TResult extends IngredientResult> {
  readonly send: (vars: TVars) => Promise<TResult>
  /** El aviso de éxito, armado con lo que devolvió el servidor. */
  readonly success: (result: TResult) => string
  readonly onDone: () => void
}

/**
 * Registrar algo en el inventario y refrescar lo que depende de ello.
 *
 * El servidor devuelve el insumo como quedó: la tabla y las alertas lo
 * muestran con esa respuesta, sin esperar a releerlas. Una compra también
 * cambia el libro y quizá el costo de las recetas, así que el inventario
 * entero se relee de fondo. El error no se avisa acá: lo muestra el
 * formulario, junto a los datos.
 */
export function useInventoryChange<TVars, TResult extends IngredientResult>({
  send,
  success,
  onDone,
}: InventoryChange<TVars, TResult>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: send,
    onSuccess: (resultado) => {
      saveIngredient(queryClient, resultado)
      push({ tone: 'info', message: success(resultado) })
      onDone()
    },
  })
}
