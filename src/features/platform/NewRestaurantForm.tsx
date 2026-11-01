import type { PlatformRestaurantDetail } from '@/api/types'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { SectionCard } from '@/components/SectionCard'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { OwnerFields } from './OwnerFields'
import { MAX_SLUG, sanitizeSlugInput } from './slug'
import { TimeZoneField } from './TimeZoneField'
import { ownerErrors, useNewRestaurantForm } from './useNewRestaurantForm'

interface NewRestaurantFormProps {
  readonly onCreated: (restaurant: PlatformRestaurantDetail) => void
  readonly onCancel: () => void
}

/**
 * El alta de un restaurante con su primer encargado.
 *
 * El identificador sigue al nombre mientras nadie lo toque; si se edita, se
 * respeta. El servidor crea el local, sus roles base y la cuenta en una sola
 * operación: si el identificador o el correo ya existen, no queda nada a medias.
 */
export function NewRestaurantForm({ onCreated, onCancel }: NewRestaurantFormProps) {
  const { register, errors, name, registration, submit } = useNewRestaurantForm(onCreated)

  return (
    <form noValidate className="flex flex-col gap-6" onSubmit={submit}>
      <SectionCard title="Restaurante">
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField id="name" label="Nombre" placeholder="La Esquina de Lucho" icon={icons.restaurant} autoComplete="off" field={name} error={errors.name?.message} />
          </div>
          <TextField
            id="slug"
            label="Identificador"
            placeholder="la-esquina-de-lucho"
            autoComplete="off"
            spellCheck={false}
            maxLength={MAX_SLUG}
            hint="Sale del nombre; puedes cambiarlo. Minúsculas, números y guiones. No se cambia después."
            sanitize={sanitizeSlugInput}
            field={register('slug')}
            error={errors.slug?.message}
          />
          <TimeZoneField id="timezone" field={register('timezone')} error={errors.timezone?.message} />
        </div>
      </SectionCard>
      <SectionCard title="Primer encargado" description="La cuenta con todos los permisos del local. Después puede crear al resto del personal.">
        <OwnerFields
          idPrefix="owner"
          fields={{ full_name: register('owner.full_name'), email: register('owner.email'), password: register('owner.password') }}
          errors={ownerErrors(errors.owner)}
        />
      </SectionCard>
      <ErrorMessage isError={registration.isError} error={registration.error} fallback="No se pudo crear el restaurante." />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={registration.isPending || registration.isSuccess}>
          <Icon glyph={icons.add} size={18} />
          <span>{registration.isPending ? 'Creando…' : 'Crear restaurante'}</span>
        </Button>
      </div>
    </form>
  )
}
