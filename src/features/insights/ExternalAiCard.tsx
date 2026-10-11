import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { restaurantQuery, restaurantQueryKey, updateRestaurant } from '@/api/restaurant'
import { Checkbox } from '@/components/ui/checkbox'
import { errorMessage } from '@/services/apiError'
import { useNotifications } from '@/store/notifications'

/**
 * Si las notas y los motivos de merma van a la IA externa (Ley N.º 29733).
 *
 * Viajan a TypeSafe AI, fuera del Perú, ya sin nombres, teléfonos, correos ni
 * documentos. Apagado, deciden las reglas fijas y nada sale del sistema.
 */
// Como en `StockRulesCard`: la casilla de Radix se nombra con aria-labelledby
// y la etiqueta apunta a ella con `htmlFor`, sin envolverla.
const CHECKBOX_ID = 'ia-externa'
const TITLE_ID = 'ia-externa-titulo'
const DETAIL_ID = 'ia-externa-detalle'

export function ExternalAiCard() {
  const restaurant = useQuery(restaurantQuery)
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const change = useMutation({
    mutationFn: (active: boolean) => updateRestaurant({ external_ai_enabled: active }),
    onSuccess: (updated) => {
      queryClient.setQueryData(restaurantQueryKey, updated)
      push({
        tone: 'info',
        message: updated.external_ai_enabled
          ? 'Las notas y mermas vuelven a clasificarse con la IA externa.'
          : 'La IA externa quedó apagada: deciden las reglas y nada sale del sistema.',
      })
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, 'No se pudo cambiar la preferencia.') })
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
        checked={restaurant.data.external_ai_enabled}
        disabled={change.isPending}
        onCheckedChange={(status) => {
          change.mutate(status === true)
        }}
      />
      <label htmlFor={CHECKBOX_ID} className="cursor-pointer">
        <span id={TITLE_ID} className="font-medium">Usar la IA externa</span>
        <span id={DETAIL_ID} className="block text-muted-foreground">
          Las notas de los pedidos y los motivos de merma se envían a TypeSafe AI, fuera del Perú, sin nombres,
          teléfonos, correos ni documentos. Apagada, deciden las reglas fijas y nada sale del sistema.
        </span>
      </label>
    </div>
  )
}
