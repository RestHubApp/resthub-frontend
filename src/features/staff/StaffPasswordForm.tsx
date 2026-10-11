import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { resetStaffPassword } from '@/api/staff'
import type { StaffResponse } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { PasswordField } from '@/components/PasswordField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { MIN_PASSWORD } from '@/services/fieldRules'
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
  const { register, handleSubmit, formState } = useForm<ResetPasswordValues>({
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

      {reset.isError ? (
        <FormMessage tone="error">
          {errorMessage(reset.error, 'No se pudo restablecer la contraseña.')}
        </FormMessage>
      ) : null}

      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-10 px-4" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-10 px-4" disabled={reset.isPending}>
          <Icon name="key" size={16} />
          <span>{reset.isPending ? 'Guardando…' : 'Restablecer'}</span>
        </Button>
      </DialogFormActions>
    </form>
  )
}
