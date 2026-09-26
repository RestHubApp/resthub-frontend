import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updatePlatformRestaurant } from '../../api/platform'
import type { PlatformRestaurantDetail } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { saveRestaurant } from './restaurantCache'

interface RestaurantStatusButtonProps {
  readonly restaurant: PlatformRestaurantDetail
}

function personas(total: number): string {
  return total === 1 ? 'la única cuenta' : `las ${String(total)} cuentas`
}

/**
 * Activa o desactiva el restaurante.
 *
 * Desactivar se confirma: corta en ese mismo momento el acceso del
 * personal entero, quizá a mitad de un turno. Activar devuelve el acceso y va
 * directo. El botón se apaga mientras viaja la petición, así un doble toque
 * no la manda dos veces.
 */
export default function RestaurantStatusButton({ restaurant }: RestaurantStatusButtonProps) {
  const queryClient = useQueryClient()
  const estado = useMutation({
    mutationFn: () => updatePlatformRestaurant(restaurant.id, { is_active: !restaurant.is_active }),
    onSuccess: (guardado) => {
      saveRestaurant(queryClient, guardado)
    },
  })
  const cambiar = () => {
    estado.mutate()
  }

  const boton = (
    <Button
      type="button"
      size="lg"
      className="h-11 px-4"
      variant={restaurant.is_active ? 'danger' : 'success'}
      disabled={estado.isPending}
      onClick={restaurant.is_active ? undefined : cambiar}
    >
      <Icon name="encender" size={18} />
      <span>{restaurant.is_active ? 'Desactivar restaurante' : 'Activar restaurante'}</span>
    </Button>
  )

  return (
    <div className="flex flex-col items-start gap-3">
      {restaurant.is_active ? (
        <ConfirmDialog
          trigger={boton}
          title={`¿Desactivar ${restaurant.name}?`}
          description={`Se corta al instante el acceso de ${personas(restaurant.staff_count)} de su personal, encargados incluidos: quien tenga RestHub abierto sale de su sesión y nadie puede volver a entrar hasta que lo actives. Sus pedidos, ventas y datos se conservan.`}
          confirmLabel="Desactivar"
          onConfirm={cambiar}
        />
      ) : (
        boton
      )}
      {estado.isError ? (
        <FormMessage tone="error">{errorMessage(estado.error, 'No se pudo cambiar el estado.')}</FormMessage>
      ) : null}
    </div>
  )
}
