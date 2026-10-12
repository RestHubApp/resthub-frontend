import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { PasswordField } from '@/components/PasswordField'
import { MIN_PASSWORD } from '@/services/fieldLimits'
import type { ChangePasswordForm } from './passwordSchema'

interface ChangePasswordFieldsProps {
  readonly register: UseFormRegister<ChangePasswordForm>
  readonly errors: FieldErrors<ChangePasswordForm>
}

/** Los tres campos del cambio de contraseña: la actual, la nueva y su repetición. */
export function ChangePasswordFields({ register, errors }: ChangePasswordFieldsProps) {
  return (
    <>
      <PasswordField
        id="current_password"
        label="Contraseña actual"
        autoComplete="current-password"
        field={register('current_password')}
        error={errors.current_password?.message}
      />
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <PasswordField
          id="new_password"
          label="Nueva contraseña"
          autoComplete="new-password"
          hint={`Al menos ${String(MIN_PASSWORD)} caracteres.`}
          field={register('new_password')}
          error={errors.new_password?.message}
        />
        <PasswordField
          id="confirm_password"
          label="Repite la nueva contraseña"
          autoComplete="new-password"
          field={register('confirm_password')}
          error={errors.confirm_password?.message}
        />
      </div>
    </>
  )
}
