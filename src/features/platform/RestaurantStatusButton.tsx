import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ErrorMessage } from '@/components/ErrorMessage'

import { platformMutationKeys, updatePlatformRestaurant } from '@/api/platform'
import type { PlatformRestaurantDetail } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
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
export function RestaurantStatusButton({ restaurant }: RestaurantStatusButtonProps) {
  const queryClient = useQueryClient()
  const status = useMutation({
    mutationKey: platformMutationKeys.updateRestaurant,
    mutationFn: () => updatePlatformRestaurant(restaurant.id, { is_active: !restaurant.is_active }),
    onSuccess: (saved) => {
      saveRestaurant(queryClient, saved)
    },
  })
  const change = () => {
    status.mutate()
  }

  const button = (
    <Button
      type="button"
      variant={restaurant.is_active ? 'destructive' : 'secondary'}
      disabled={status.isPending}
      onClick={restaurant.is_active ? undefined : change}
    >
      <Icon name="turnOn" size={18} />
      <span>{restaurant.is_active ? 'Desactivar restaurante' : 'Activar restaurante'}</span>
    </Button>
  )

  return (
    <div className="flex flex-col items-start gap-3">
      {restaurant.is_active ? (
        <ConfirmDialog
          trigger={button}
          title={`¿Desactivar ${restaurant.name}?`}
          description={`Se corta al instante el acceso de ${personas(restaurant.staff_count)} de su personal, encargados incluidos: quien tenga RestHub abierto sale de su sesión y nadie puede volver a entrar hasta que lo actives. Sus pedidos, ventas y datos se conservan.`}
          confirmLabel="Desactivar"
          onConfirm={change}
        />
      ) : (
        button
      )}
      {status.isError ? (
        <ErrorMessage error={status.error} fallback="No se pudo cambiar el estado." />
      ) : null}
    </div>
  )
}
