import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { type FieldErrors } from 'react-hook-form'

import { createPlatformRestaurant, PASSWORD_MUTATION_GC_TIME, platformMutationKeys } from '@/api/platform'
import type { PlatformRestaurantDetail } from '@/api/types'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import {
  createRestaurantPayload,
  createRestaurantSchema,
  type CreateRestaurantValues,
  EMPTY_RESTAURANT,
} from './platformSchema'
import { saveRestaurant } from './restaurantCache'
import { followSlug } from './slug'

/** Mensajes de error de los campos del primer encargado. */
export function ownerErrors(errors: FieldErrors<CreateRestaurantValues>['owner']) {
  return {
    full_name: errors?.full_name?.message,
    email: errors?.email?.message,
    password: errors?.password?.message,
  }
}

/**
 * El formulario de alta de un restaurante: campos, mutación y el identificador
 * que sigue al nombre mientras nadie lo toque.
 */
export function useNewRestaurantForm(onCreated: (restaurant: PlatformRestaurantDetail) => void) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState, getValues, setValue } = useAppForm<CreateRestaurantValues>({
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
  const name = register('name', {
    onChange: (event: { target: { value: string } }) => {
      const next = event.target.value
      setValue('slug', followSlug(previousName, next, getValues('slug')), {
        shouldValidate: formState.isSubmitted,
      })
      setPreviousName(next)
    },
  })
  const submit = onSubmit(
    handleSubmit((values) => {
      registration.mutate(values)
    }),
  )

  return { register, errors: formState.errors, name, registration, submit }
}
