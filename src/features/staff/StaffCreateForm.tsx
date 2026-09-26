import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { createStaff } from '../../api/staff'
import type { Role } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PasswordField from '../../components/PasswordField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { MIN_PASSWORD } from '../../services/fieldRules'
import { defaultRoleId } from './roleOptions'
import StaffFields from './StaffFields'
import { saveStaffMember } from './staffList'
import {
  createPayload,
  type CreateStaffValues,
  createStaffSchema,
  emptyCreateStaff,
} from './staffSchema'

interface StaffCreateFormProps {
  /** Los roles que quien mira puede dar. */
  readonly roles: readonly Role[]
  /** Se llama al crear la cuenta o al cancelar: cierra la ventana. */
  readonly onDone: () => void
}

export default function StaffCreateForm({ roles, onDone }: StaffCreateFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: emptyCreateStaff(defaultRoleId(roles)),
  })

  const alta = useMutation({
    mutationFn: (valores: CreateStaffValues) => createStaff(createPayload(valores)),
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
          alta.mutate(valores)
        }),
      )}
    >
      <StaffFields
        fields={{
          full_name: register('full_name'),
          email: register('email'),
          role_id: register('role_id'),
        }}
        errors={{
          full_name: errores.full_name?.message,
          email: errores.email?.message,
          role_id: errores.role_id?.message,
        }}
        roles={roles}
      />
      <PasswordField
        id="password"
        label="Contraseña inicial"
        placeholder={`Mínimo ${String(MIN_PASSWORD)} caracteres`}
        autoComplete="new-password"
        hint="Díctasela a la persona y pídele que la cambie en Mi perfil."
        field={register('password')}
        error={errores.password?.message}
      />

      {alta.isError ? (
        <FormMessage tone="error">
          {errorMessage(alta.error, 'No se pudo crear la cuenta.')}
        </FormMessage>
      ) : null}

      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-10 px-4" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-10 px-4" disabled={alta.isPending}>
          <Icon name="agregar" size={16} />
          <span>{alta.isPending ? 'Creando…' : 'Crear cuenta'}</span>
        </Button>
      </DialogFormActions>
    </form>
  )
}
