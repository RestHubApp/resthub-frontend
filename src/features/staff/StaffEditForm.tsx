import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { staffQueryKey, updateStaff } from '../../api/staff'
import type { StaffResponse } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import StaffFields from './StaffFields'
import { identityOf, type StaffIdentityValues, staffIdentitySchema } from './staffSchema'

interface StaffEditFormProps {
  readonly account: StaffResponse
  /** La cuenta es la de quien esta mirando: no puede cambiarse el tipo. */
  readonly isSelf: boolean
  readonly onDone: () => void
}

export default function StaffEditForm({ account, isSelf, onDone }: StaffEditFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useForm<StaffIdentityValues>({
    resolver: zodResolver(staffIdentitySchema),
    defaultValues: identityOf(account),
  })

  const guardar = useMutation({
    // La cuenta propia no manda el tipo: el servidor igual lo rechazaria.
    mutationFn: (valores: StaffIdentityValues) =>
      updateStaff(account.id, isSelf ? { ...valores, role: undefined } : valores),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey })
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
          guardar.mutate(valores)
        }),
      )}
    >
      <StaffFields
        fields={{
          full_name: register('full_name'),
          email: register('email'),
          role: register('role'),
        }}
        errors={{
          full_name: errores.full_name?.message,
          email: errores.email?.message,
          role: errores.role?.message,
        }}
        lockedRoleLabel={isSelf ? account.role_label : undefined}
      />

      {guardar.isError ? (
        <FormMessage tone="error">
          {errorMessage(guardar.error, 'No se pudieron guardar los cambios.')}
        </FormMessage>
      ) : null}

      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-10 px-4" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-10 px-4" disabled={guardar.isPending}>
          <Icon name="confirmar" size={16} />
          <span>{guardar.isPending ? 'Guardando…' : 'Guardar'}</span>
        </Button>
      </DialogFormActions>
    </form>
  )
}
