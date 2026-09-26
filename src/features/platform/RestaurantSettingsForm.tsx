import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { updatePlatformRestaurant } from '../../api/platform'
import type { PlatformRestaurantDetail } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import {
  restaurantSettingsSchema,
  type RestaurantSettingsValues,
  settingsOf,
  settingsPayload,
} from './platformSchema'
import { saveRestaurant } from './restaurantCache'
import TimeZoneField from './TimeZoneField'

interface RestaurantSettingsFormProps {
  readonly restaurant: PlatformRestaurantDetail
}

/**
 * Nombre y zona horaria del restaurante.
 *
 * Al guardar, el formulario toma lo que devolvió el servidor: si recortó el
 * nombre o rechazó algo, se ve eso y no lo que se escribió.
 */
export default function RestaurantSettingsForm({ restaurant }: RestaurantSettingsFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState, reset } = useForm<RestaurantSettingsValues>({
    resolver: zodResolver(restaurantSettingsSchema),
    defaultValues: settingsOf(restaurant),
  })
  const guardar = useMutation({
    mutationFn: (valores: RestaurantSettingsValues) =>
      updatePlatformRestaurant(restaurant.id, settingsPayload(valores, restaurant)),
    onSuccess: (guardado) => {
      saveRestaurant(queryClient, guardado)
      reset(settingsOf(guardado))
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          guardar.mutate(valores)
        }),
      )}
    >
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <TextField
          id="settings-name"
          label="Nombre"
          icon="restaurante"
          autoComplete="off"
          field={register('name')}
          error={formState.errors.name?.message}
        />
        <TimeZoneField
          id="settings-timezone"
          field={register('timezone')}
          error={formState.errors.timezone?.message}
          current={restaurant.timezone}
        />
      </div>
      {guardar.isError ? (
        <FormMessage tone="error">{errorMessage(guardar.error, 'No se pudieron guardar los cambios.')}</FormMessage>
      ) : null}
      {guardar.isSuccess && !formState.isDirty ? <FormMessage tone="ok">Cambios guardados.</FormMessage> : null}
      <div className="flex justify-end">
        <Button type="submit" size="lg" className="h-11 px-4" disabled={guardar.isPending || !formState.isDirty}>
          <Icon name="confirmar" size={18} />
          <span>{guardar.isPending ? 'Guardando…' : 'Guardar cambios'}</span>
        </Button>
      </div>
    </form>
  )
}
