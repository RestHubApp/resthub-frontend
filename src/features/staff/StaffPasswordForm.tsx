import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'

import { resetStaffPassword } from '@/api/staff'
import type { StaffResponse } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { PasswordField } from '@/components/PasswordField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { MIN_PASSWORD } from '@/services/fieldLimits'
import { useNotifications } from '@/store/notifications'
import { type ResetPasswordValues, resetPasswordSchema } from './staffSchema'

interface StaffPasswordFormProps {
  readonly account: StaffResponse
  readonly onDone: () => void
}

/**
 * Restablece la contraseña de otra cuenta.
 *
 * No hay recuperacion por correo: quien la olvida le pide al encargado una
 * nueva, que se la dicta en persona.
 */
export function StaffPasswordForm({ account, onDone }: StaffPasswordFormProps) {
  const { register, handleSubmit, formState } = useAppForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: '' },
  })

  const push = useNotifications((state) => state.push)
  const reset = useMutation({
    mutationFn: (values: ResetPasswordValues) => resetStaffPassword(account.id, values),
    onSuccess: () => {
      push({ tone: 'info', message: `Contraseña de ${account.full_name} restablecida.` })
      onDone()
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          reset.mutate(values)
        }),
      )}
    >
      <PasswordField
        id="new_password"
        label="Nueva contraseña"
        placeholder={`Mínimo ${String(MIN_PASSWORD)} caracteres`}
        autoComplete="new-password"
        hint="La contraseña anterior deja de servir en cuanto guardes."
        field={register('new_password')}
        error={formState.errors.new_password?.message}
      />

      <FormFooter
        mutation={reset}
        failureText="No se pudo restablecer la contraseña."
        onCancel={onDone}
        submit={{ label: 'Restablecer', pendingLabel: 'Guardando…', icon: 'key' }}
      />
    </form>
  )
}
