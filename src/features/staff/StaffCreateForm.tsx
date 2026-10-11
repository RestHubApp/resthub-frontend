import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { Role } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { PasswordField } from '@/components/PasswordField'
import { onSubmit } from '@/hooks/formSubmit'
import { MIN_PASSWORD } from '@/services/fieldRules'
import { defaultRoleId } from './roleOptions'
import { StaffFields } from './StaffFields'
import {
  type CreateStaffValues,
  createStaffSchema,
  emptyCreateStaff,
} from './staffSchema'
import { useCreateStaff } from './useCreateStaff'

interface StaffCreateFormProps {
  /** Los roles que quien mira puede dar. */
  readonly roles: readonly Role[]
  /** Se llama al crear la cuenta o al cancelar: cierra la ventana. */
  readonly onDone: () => void
}

/** El formulario para dar de alta una cuenta del personal con su contraseña inicial. */
export function StaffCreateForm({ roles, onDone }: StaffCreateFormProps) {
  const { register, handleSubmit, formState } = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: emptyCreateStaff(defaultRoleId(roles)),
  })

  const registration = useCreateStaff(onDone)

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
      <StaffFields
        fields={{
          full_name: register('full_name'),
          email: register('email'),
          role_id: register('role_id'),
        }}
        errors={{
          full_name: errors.full_name?.message,
          email: errors.email?.message,
          role_id: errors.role_id?.message,
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
        error={errors.password?.message}
      />

      <FormFooter
        mutation={registration}
        failureText="No se pudo crear la cuenta."
        onCancel={onDone}
        submit={{ label: 'Crear cuenta', pendingLabel: 'Creando…', icon: 'add' }}
      />
    </form>
  )
}
