import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { platformMutationKeys, updatePlatformRestaurant } from '@/api/platform'
import type { PlatformRestaurantDetail, UpdatePlatformRestaurantRequest } from '@/api/types'
import { onSubmit } from '@/hooks/formSubmit'
import {
  restaurantSettingsSchema,
  type RestaurantSettingsValues,
  settingsOf,
  settingsPayload,
} from './platformSchema'
import { saveRestaurant } from './restaurantCache'

/**
 * El formulario de ajustes de un restaurante: sigue a la ficha del caché,
 * envía solo lo que el usuario tocó y toma lo que devolvió el servidor.
 */
export function useRestaurantSettings(restaurant: PlatformRestaurantDetail) {
  const queryClient = useQueryClient()
  const saved = useMemo(() => settingsOf(restaurant), [restaurant])
  const { register, handleSubmit, formState, reset } = useForm<RestaurantSettingsValues>({
    resolver: zodResolver(restaurantSettingsSchema(restaurant.timezone)),
    defaultValues: saved,
  })
  // Sigue a la ficha del caché sin perder lo que se está escribiendo. Con la
  // opción `values` de useForm, ese reinicio podía llegar después del de
  // `onSuccess` y devolver lo escrito antes de guardar.
  useEffect(() => {
    reset(saved, { keepDirtyValues: true })
  }, [saved, reset])
  const save = useMutation({
    mutationKey: platformMutationKeys.updateRestaurant,
    mutationFn: (changes: UpdatePlatformRestaurantRequest) => updatePlatformRestaurant(restaurant.id, changes),
    onSuccess: (updated) => {
      saveRestaurant(queryClient, updated)
      reset(settingsOf(updated))
    },
  })
  const submit = onSubmit(
    handleSubmit((values) => {
      const changes = settingsPayload(values, formState.dirtyFields, restaurant)
      if (Object.keys(changes).length === 0) {
        // Lo tocado quedó igual a lo guardado: no hay nada que enviar.
        reset(saved)
        return
      }
      save.mutate(changes)
    }),
  )

  return { register, errors: formState.errors, isDirty: formState.isDirty, save, submit }
}
