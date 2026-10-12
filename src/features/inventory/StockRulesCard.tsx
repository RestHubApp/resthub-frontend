import { useQuery } from '@tanstack/react-query'

import { menuQueryKey } from '@/api/menu'
import { restaurantQuery } from '@/api/restaurant'
import { SettingToggle } from '@/components/SettingToggle'
import { useRestaurantSetting } from '@/store/useRestaurantSetting'

/**
 * Si los platos sin insumos se agotan solos.
 *
 * Encendido, un plato cuya receta pide más de lo que hay aparece «Sin
 * insumos» y no se puede pedir. Conviene apagarlo mientras el local todavía no
 * registra sus compras: si no, la carta entera figuraría agotada.
 */
export function StockRulesCard() {
  const restaurant = useQuery(restaurantQuery)
  const change = useRestaurantSetting({
    field: 'auto_out_of_stock',
    success: (updated) =>
      updated.auto_out_of_stock ? 'Los platos sin insumos se agotan solos.' : 'Los platos ya no se agotan por el stock.',
    failure: 'No se pudo cambiar la regla.',
    invalidate: [menuQueryKey],
  })
  if (!restaurant.isSuccess) {
    return null
  }

  return (
    <SettingToggle
      id="regla-agotado"
      title="Marcar «Sin insumos» automáticamente"
      detail="Si falta un ingrediente de la receta, el mesero ve el plato como no disponible y no lo puede pedir."
      isChecked={restaurant.data.auto_out_of_stock}
      isPending={change.isPending}
      onChange={change.mutate}
    />
  )
}
