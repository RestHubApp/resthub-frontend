import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { updateStaff } from '@/api/staff'
import type { Role, StaffResponse } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { onSubmit } from '@/hooks/formSubmit'
import { StaffFields } from './StaffFields'
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

export function StaffEditForm({ account, roles, isSelf, onDone }: StaffEditFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useForm<StaffIdentityValues>({
    resolver: zodResolver(staffIdentitySchema),
    defaultValues: identityOf(account),
  })

  const save = useMutation({
    // La cuenta propia no manda el rol: el servidor responde 409 si lo intenta.
    mutationFn: (values: StaffIdentityValues) =>
      updateStaff(account.id, isSelf ? { full_name: values.full_name } : identityPayload(values)),
    onSuccess: (updatedAccount) => {
      saveStaffMember(queryClient, updatedAccount)
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
          save.mutate(values)
        }),
      )}
    >
      <StaffFields
        fields={{
          full_name: register('full_name'),
          role_id: register('role_id'),
        }}
        errors={{
          full_name: errors.full_name?.message,
          role_id: errors.role_id?.message,
        }}
        roles={roles}
        fixedEmail={account.email}
        lockedRoleLabel={isSelf ? account.role_label : undefined}
      />

      <FormFooter
        mutation={save}
        failureText="No se pudieron guardar los cambios."
        onCancel={onDone}
        submit={{ label: 'Guardar', pendingLabel: 'Guardando…', icon: 'confirm' }}
      />
    </form>
  )
}
