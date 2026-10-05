import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { restaurantQuery, restaurantQueryKey, updateRestaurant } from '../../api/restaurant'
import { Checkbox } from '../../components/ui/checkbox'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

/**
 * Si las notas y los motivos de merma van a la IA externa (Ley N.º 29733).
 *
 * Viajan a TypeSafe AI, fuera del Perú, ya sin nombres, teléfonos, correos ni
 * documentos. Apagado, deciden las reglas fijas y nada sale del sistema.
 */
// Como en `StockRulesCard`: la casilla de Radix se nombra con aria-labelledby
// y la etiqueta apunta a ella con `htmlFor`, sin envolverla.
const CASILLA_ID = 'ia-externa'
const TITULO_ID = 'ia-externa-titulo'
const DETALLE_ID = 'ia-externa-detalle'

export default function ExternalAiCard() {
  const restaurante = useQuery(restaurantQuery)
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const cambiar = useMutation({
    mutationFn: (activa: boolean) => updateRestaurant({ external_ai_enabled: activa }),
    onSuccess: (actualizado) => {
      queryClient.setQueryData(restaurantQueryKey, actualizado)
      push({
        tone: 'info',
        message: actualizado.external_ai_enabled
          ? 'Las notas y mermas vuelven a clasificarse con la IA externa.'
          : 'La IA externa quedó apagada: deciden las reglas y nada sale del sistema.',
      })
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, 'No se pudo cambiar la preferencia.') })
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
        checked={restaurante.data.external_ai_enabled}
        disabled={cambiar.isPending}
        onCheckedChange={(estado) => {
          cambiar.mutate(estado === true)
        }}
      />
      <label htmlFor={CASILLA_ID} className="cursor-pointer">
        <span id={TITULO_ID} className="font-medium">Usar la IA externa</span>
        <span id={DETALLE_ID} className="block text-muted-foreground">
          Las notas de los pedidos y los motivos de merma se envían a TypeSafe AI, fuera del Perú, sin nombres,
          teléfonos, correos ni documentos. Apagada, deciden las reglas fijas y nada sale del sistema.
        </span>
      </label>
    </div>
  )
}
