import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { type FieldErrors, useForm } from 'react-hook-form'

import { createPlatformRestaurant } from '../../api/platform'
import type { PlatformRestaurantDetail } from '../../api/platformTypes'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import SectionCard from '../../components/SectionCard'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import OwnerFields from './OwnerFields'
import {
  createRestaurantPayload,
  createRestaurantSchema,
  type CreateRestaurantValues,
  EMPTY_RESTAURANT,
} from './platformSchema'
import { saveRestaurant } from './restaurantCache'
import { followSlug, MAX_SLUG, sanitizeSlugInput } from './slug'
import TimeZoneField from './TimeZoneField'

function ownerErrors(errors: FieldErrors<CreateRestaurantValues>['owner']) {
  return {
    full_name: errors?.full_name?.message,
    email: errors?.email?.message,
    password: errors?.password?.message,
  }
}

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
export default function NewRestaurantForm({ onCreated, onCancel }: NewRestaurantFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState, getValues, setValue } = useForm<CreateRestaurantValues>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: EMPTY_RESTAURANT,
  })
  // El nombre con el que se sugirió el identificador que está en el campo.
  const [nombreAnterior, setNombreAnterior] = useState('')
  const alta = useMutation({
    mutationFn: (valores: CreateRestaurantValues) => createPlatformRestaurant(createRestaurantPayload(valores)),
    onSuccess: (restaurante) => {
      saveRestaurant(queryClient, restaurante)
      onCreated(restaurante)
    },
  })
  const errores = formState.errors
  const nombre = register('name', {
    onChange: (evento: { target: { value: string } }) => {
      const siguiente = evento.target.value
      setValue('slug', followSlug(nombreAnterior, siguiente, getValues('slug')), {
        shouldValidate: formState.isSubmitted,
      })
      setNombreAnterior(siguiente)
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          alta.mutate(valores)
        }),
      )}
    >
      <SectionCard title="Restaurante">
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField id="name" label="Nombre" placeholder="La Esquina de Lucho" icon="restaurante" autoComplete="off" field={nombre} error={errores.name?.message} />
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
            error={errores.slug?.message}
          />
          <TimeZoneField id="timezone" field={register('timezone')} error={errores.timezone?.message} />
        </div>
      </SectionCard>
      <SectionCard title="Primer encargado" description="La cuenta con todos los permisos del local. Después puede crear al resto del personal.">
        <OwnerFields
          idPrefix="owner"
          fields={{ full_name: register('owner.full_name'), email: register('owner.email'), password: register('owner.password') }}
          errors={ownerErrors(errores.owner)}
        />
      </SectionCard>
      {alta.isError ? <FormMessage tone="error">{errorMessage(alta.error, 'No se pudo crear el restaurante.')}</FormMessage> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-11 px-4" disabled={alta.isPending || alta.isSuccess}>
          <Icon name="agregar" size={18} />
          <span>{alta.isPending ? 'Creando…' : 'Crear restaurante'}</span>
        </Button>
      </div>
    </form>
  )
}
