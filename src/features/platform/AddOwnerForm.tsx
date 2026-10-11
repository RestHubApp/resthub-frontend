import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { addPlatformOwner, PASSWORD_MUTATION_GC_TIME, platformMutationKeys } from '@/api/platform'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { OwnerFields } from './OwnerFields'
import { EMPTY_OWNER, ownerSchema, type OwnerValues } from './platformSchema'
import { saveOwner } from './restaurantCache'

interface AddOwnerFormProps {
  readonly restaurantId: number
  /** Al crear la cuenta o al cancelar: cierra la ventana. */
  readonly onDone: () => void
}

/** Otra cuenta con el rol Encargado del restaurante. Un correo ya usado lo rechaza el servidor (409). */
export function AddOwnerForm({ restaurantId, onDone }: AddOwnerFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useForm<OwnerValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: EMPTY_OWNER,
  })
  const registration = useMutation({
    mutationKey: platformMutationKeys.addOwner,
    mutationFn: (values: OwnerValues) => addPlatformOwner(restaurantId, values),
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: (owner) => {
      saveOwner(queryClient, restaurantId, owner)
      onDone()
    },
  })
  const errors = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          registration.mutate(values)
        }),
      )}
    >
      <OwnerFields
        idPrefix="new-owner"
        fields={{ full_name: register('full_name'), email: register('email'), password: register('password') }}
        errors={{
          full_name: errors.full_name?.message,
          email: errors.email?.message,
          password: errors.password?.message,
        }}
      />
      {registration.isError ? (
        <FormMessage tone="error">{errorMessage(registration.error, 'No se pudo agregar al encargado.')}</FormMessage>
      ) : null}
      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-10 px-4" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-10 px-4" disabled={registration.isPending}>
          <Icon name="add" size={16} />
          <span>{registration.isPending ? 'Agregando…' : 'Agregar encargado'}</span>
        </Button>
      </DialogFormActions>
    </form>
  )
}
