import type { PlatformRestaurantDetail } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/apiError'
import { TimeZoneField } from './TimeZoneField'
import { useRestaurantSettings } from './useRestaurantSettings'


interface RestaurantSettingsFormProps {
  readonly restaurant: PlatformRestaurantDetail
}

/**
 * Nombre y zona horaria del restaurante.
 *
 * El formulario sigue a la ficha del caché: si se relee y otro administrador
 * cambió algo, se ve aquí sin perder lo que se está escribiendo. Al guardar
 * viaja solo lo que el usuario tocó, y el formulario toma lo que devolvió el
 * servidor: si recortó el nombre o rechazó algo, se ve eso y no lo que se
 * escribió.
 */
export function RestaurantSettingsForm({ restaurant }: RestaurantSettingsFormProps) {
  const { register, errors, isDirty, save, submit } = useRestaurantSettings(restaurant)

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={submit}>
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <TextField
          id="settings-name"
          label="Nombre"
          icon="restaurant"
          autoComplete="off"
          field={register('name')}
          error={errors.name?.message}
        />
        <TimeZoneField
          id="settings-timezone"
          field={register('timezone')}
          error={errors.timezone?.message}
          current={restaurant.timezone}
        />
      </div>
      {save.isError ? (
        <FormMessage tone="error">{errorMessage(save.error, 'No se pudieron guardar los cambios.')}</FormMessage>
      ) : null}
      {save.isSuccess && !isDirty ? <FormMessage tone="ok">Cambios guardados.</FormMessage> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending || !isDirty}>
          <Icon name="confirm" size={18} />
          <span>{save.isPending ? 'Guardando…' : 'Guardar cambios'}</span>
        </Button>
      </div>
    </form>
  )
}
