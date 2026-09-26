import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { addPlatformOwner, PASSWORD_MUTATION_GC_TIME, platformMutationKeys } from '../../api/platform'
import DialogFormActions from '../../components/DialogFormActions'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import OwnerFields from './OwnerFields'
import { EMPTY_OWNER, ownerSchema, type OwnerValues } from './platformSchema'
import { saveOwner } from './restaurantCache'

interface AddOwnerFormProps {
  readonly restaurantId: number
  /** Al crear la cuenta o al cancelar: cierra la ventana. */
  readonly onDone: () => void
}

/** Otra cuenta con el rol Encargado del restaurante. Un correo ya usado lo rechaza el servidor (409). */
export default function AddOwnerForm({ restaurantId, onDone }: AddOwnerFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useForm<OwnerValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: EMPTY_OWNER,
  })
  const alta = useMutation({
    mutationKey: platformMutationKeys.addOwner,
    mutationFn: (valores: OwnerValues) => addPlatformOwner(restaurantId, valores),
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: (encargado) => {
      saveOwner(queryClient, restaurantId, encargado)
      onDone()
    },
  })
  const errores = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          alta.mutate(valores)
        }),
      )}
    >
      <OwnerFields
        idPrefix="new-owner"
        fields={{ full_name: register('full_name'), email: register('email'), password: register('password') }}
        errors={{
          full_name: errores.full_name?.message,
          email: errores.email?.message,
          password: errores.password?.message,
        }}
      />
      {alta.isError ? (
        <FormMessage tone="error">{errorMessage(alta.error, 'No se pudo agregar al encargado.')}</FormMessage>
      ) : null}
      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-10 px-4" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-10 px-4" disabled={alta.isPending}>
          <Icon name="agregar" size={16} />
          <span>{alta.isPending ? 'Agregando…' : 'Agregar encargado'}</span>
        </Button>
      </DialogFormActions>
    </form>
  )
}
