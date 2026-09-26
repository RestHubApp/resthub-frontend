import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { updateStaff } from '../../api/staff'
import type { Role, StaffResponse } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import StaffFields from './StaffFields'
import { saveStaffMember } from './staffList'
import {
  identityOf,
  identityPayload,
  type StaffIdentityValues,
  staffIdentitySchema,
} from './staffSchema'

interface StaffEditFormProps {
  readonly account: StaffResponse
  /** Los roles que quien mira puede dar, con el que la cuenta ya tiene. */
  readonly roles: readonly Role[]
  /** La cuenta es la de quien esta mirando: no puede cambiarse el rol. */
  readonly isSelf: boolean
  readonly onDone: () => void
}

export default function StaffEditForm({ account, roles, isSelf, onDone }: StaffEditFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useForm<StaffIdentityValues>({
    resolver: zodResolver(staffIdentitySchema),
    defaultValues: identityOf(account),
  })

  const guardar = useMutation({
    // La cuenta propia no manda el rol: el servidor responde 409 si lo intenta.
    mutationFn: (valores: StaffIdentityValues) =>
      updateStaff(account.id, isSelf ? { full_name: valores.full_name } : identityPayload(valores)),
    onSuccess: (cuenta) => {
      saveStaffMember(queryClient, cuenta)
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
          role_id: register('role_id'),
        }}
        errors={{
          full_name: errores.full_name?.message,
          role_id: errores.role_id?.message,
        }}
        roles={roles}
        fixedEmail={account.email}
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
