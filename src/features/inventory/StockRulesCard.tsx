import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { menuQueryKey } from '../../api/menu'
import { restaurantQuery, restaurantQueryKey, updateRestaurant } from '../../api/restaurant'
import { Checkbox } from '../../components/ui/checkbox'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

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
const CASILLA_ID = 'regla-agotado'
const TITULO_ID = 'regla-agotado-titulo'
const DETALLE_ID = 'regla-agotado-detalle'

export default function StockRulesCard() {
  const restaurante = useQuery(restaurantQuery)
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const cambiar = useMutation({
    mutationFn: (activo: boolean) => updateRestaurant({ auto_out_of_stock: activo }),
    onSuccess: (actualizado) => {
      queryClient.setQueryData(restaurantQueryKey, actualizado)
      void queryClient.invalidateQueries({ queryKey: menuQueryKey })
      push({
        tone: 'info',
        message: actualizado.auto_out_of_stock
          ? 'Los platos sin insumos se agotan solos.'
          : 'Los platos ya no se agotan por el stock.',
      })
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, 'No se pudo cambiar la regla.') })
    },
  })
  if (!restaurante.isSuccess) {
    return null
  }

  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
      <Checkbox
        id={CASILLA_ID}
        aria-labelledby={TITULO_ID}
        aria-describedby={DETALLE_ID}
        className="mt-0.5"
        checked={restaurante.data.auto_out_of_stock}
        disabled={cambiar.isPending}
        onCheckedChange={(estado) => {
          cambiar.mutate(estado === true)
        }}
      />
      <label htmlFor={CASILLA_ID} className="cursor-pointer">
        <span id={TITULO_ID} className="font-medium">Agotar solos los platos sin insumos</span>
        <span id={DETALLE_ID} className="block text-muted-foreground">
          Si la receta de un plato pide más de lo que hay en stock, el mesero lo ve «Sin insumos» y no lo puede pedir.
        </span>
      </label>
    </div>
  )
}
