import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addPlatformOwner, PASSWORD_MUTATION_GC_TIME, platformMutationKeys } from '@/api/platform'
import { FormFooter } from '@/components/FormFooter'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
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
  const { register, handleSubmit, formState } = useAppForm<OwnerValues>({
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
      <FormFooter
        mutation={registration}
        failureText="No se pudo agregar al encargado."
        onCancel={onDone}
        submit={{ label: 'Agregar encargado', pendingLabel: 'Agregando…', icon: 'add' }}
      />
    </form>
  )
}
