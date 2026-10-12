import { useQuery } from '@tanstack/react-query'

import { restaurantQuery } from '@/api/restaurant'
import { SettingToggle } from '@/components/SettingToggle'
import { useRestaurantSetting } from '@/store/useRestaurantSetting'

/**
 * Si las notas y los motivos de merma van a la IA externa (Ley N.º 29733).
 *
 * Viajan a TypeSafe AI, fuera del Perú, ya sin nombres, teléfonos, correos ni
 * documentos. Apagado, deciden las reglas fijas y nada sale del sistema.
 */
export function ExternalAiCard() {
  const restaurant = useQuery(restaurantQuery)
  const change = useRestaurantSetting({
    field: 'external_ai_enabled',
    success: (updated) =>
      updated.external_ai_enabled
        ? 'Las notas y mermas vuelven a clasificarse con la IA externa.'
        : 'La IA externa quedó apagada: deciden las reglas y nada sale del sistema.',
    failure: 'No se pudo cambiar la preferencia.',
  })
  if (!restaurant.isSuccess) {
    return null
  }

  return (
    <SettingToggle
      id="ia-externa"
      title="Usar la IA externa"
      detail="Las notas de los pedidos y los motivos de merma se envían a TypeSafe AI, fuera del Perú, sin nombres, teléfonos, correos ni documentos. Apagada, deciden las reglas fijas y nada sale del sistema."
      isChecked={restaurant.data.external_ai_enabled}
      isPending={change.isPending}
      onChange={change.mutate}
    />
  )
}
