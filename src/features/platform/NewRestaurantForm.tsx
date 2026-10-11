import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { type FieldErrors, useForm } from 'react-hook-form'

import { createPlatformRestaurant, PASSWORD_MUTATION_GC_TIME, platformMutationKeys } from '@/api/platform'
import type { PlatformRestaurantDetail } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { SectionCard } from '@/components/SectionCard'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { OwnerFields } from './OwnerFields'
import {
  createRestaurantPayload,
  createRestaurantSchema,
  type CreateRestaurantValues,
  EMPTY_RESTAURANT,
} from './platformSchema'
import { saveRestaurant } from './restaurantCache'
import { followSlug, MAX_SLUG, sanitizeSlugInput } from './slug'
import { TimeZoneField } from './TimeZoneField'

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
export function NewRestaurantForm({ onCreated, onCancel }: NewRestaurantFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState, getValues, setValue } = useForm<CreateRestaurantValues>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: EMPTY_RESTAURANT,
  })
  // El nombre con el que se sugirió el identificador que está en el campo.
  const [previousName, setPreviousName] = useState('')
  const registration = useMutation({
    mutationKey: platformMutationKeys.createRestaurant,
    mutationFn: (values: CreateRestaurantValues) => createPlatformRestaurant(createRestaurantPayload(values)),
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: (restaurant) => {
      saveRestaurant(queryClient, restaurant)
      onCreated(restaurant)
    },
  })
  const errors = formState.errors
  const name = register('name', {
    onChange: (event: { target: { value: string } }) => {
      const next = event.target.value
      setValue('slug', followSlug(previousName, next, getValues('slug')), {
        shouldValidate: formState.isSubmitted,
      })
      setPreviousName(next)
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          registration.mutate(values)
        }),
      )}
    >
      <SectionCard title="Restaurante">
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField id="name" label="Nombre" placeholder="La Esquina de Lucho" icon="restaurante" autoComplete="off" field={name} error={errors.name?.message} />
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
      {registration.isError ? <FormMessage tone="error">{errorMessage(registration.error, 'No se pudo crear el restaurante.')}</FormMessage> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-11 px-4" disabled={registration.isPending || registration.isSuccess}>
          <Icon name="agregar" size={18} />
          <span>{registration.isPending ? 'Creando…' : 'Crear restaurante'}</span>
        </Button>
      </div>
    </form>
  )
}
