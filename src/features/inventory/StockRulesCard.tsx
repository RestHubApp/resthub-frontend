import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { menuQueryKey } from '@/api/menu'
import { restaurantQuery, restaurantQueryKey, updateRestaurant } from '@/api/restaurant'
import { Checkbox } from '@/components/ui/checkbox'
import { errorMessage } from '@/services/apiError'
import { useNotifications } from '@/store/notifications'

/**
 * Si los platos sin insumos se agotan solos.
 *
 * Encendido, un plato cuya receta pide más de lo que hay aparece «Sin
 * insumos» y no se puede pedir. Conviene apagarlo mientras el local todavía no
 * registra sus compras: si no, la carta entera figuraría agotada.
 */
// La casilla de Radix es un <button>: se nombra con aria-labelledby, porque
// algunos validadores (WAVE) no toman el texto del <label> que la envuelve, y
// la etiqueta apunta a la casilla con `htmlFor` en vez de envolverla (un
// <label> que envuelve un <button> queda «huérfano» para WAVE).
const CHECKBOX_ID = 'regla-agotado'
const TITLE_ID = 'regla-agotado-titulo'
const DETAIL_ID = 'regla-agotado-detalle'

export function StockRulesCard() {
  const restaurant = useQuery(restaurantQuery)
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const change = useMutation({
    mutationFn: (active: boolean) => updateRestaurant({ auto_out_of_stock: active }),
    onSuccess: (updated) => {
      queryClient.setQueryData(restaurantQueryKey, updated)
      void queryClient.invalidateQueries({ queryKey: menuQueryKey })
      push({
        tone: 'info',
        message: updated.auto_out_of_stock
          ? 'Los platos sin insumos se agotan solos.'
          : 'Los platos ya no se agotan por el stock.',
      })
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, 'No se pudo cambiar la regla.') })
    },
  })
  if (!restaurant.isSuccess) {
    return null
  }

  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
      <Checkbox
        id={CHECKBOX_ID}
        aria-labelledby={TITLE_ID}
        aria-describedby={DETAIL_ID}
        className="mt-0.5"
        checked={restaurant.data.auto_out_of_stock}
        disabled={change.isPending}
        onCheckedChange={(status) => {
          change.mutate(status === true)
        }}
      />
      <label htmlFor={CHECKBOX_ID} className="cursor-pointer">
        <span id={TITLE_ID} className="font-medium">Marcar «Sin insumos» automáticamente</span>
        <span id={DETAIL_ID} className="block text-muted-foreground">
          Si falta un ingrediente de la receta, el mesero ve el plato como no disponible y no lo puede pedir.
        </span>
      </label>
    </div>
  )
}
