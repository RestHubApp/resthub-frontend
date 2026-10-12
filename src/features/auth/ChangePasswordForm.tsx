import { zodResolver } from '@hookform/resolvers/zod'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useForm } from 'react-hook-form'

import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { ChangePasswordFields } from './ChangePasswordFields'
import {
  type ChangePasswordForm as Form,
  changePasswordSchema,
  EMPTY_CHANGE_PASSWORD,
} from './passwordSchema'
import { useChangePassword } from './useChangePassword'

/**
 * Cambio de la contraseña propia.
 *
 * Pide la actual aunque la sesion este abierta: un celular prestado o una
 * laptop sin bloquear no deberian alcanzar para quedarse con la cuenta.
 */
export function ChangePasswordForm() {
  const { register, handleSubmit, formState, reset } = useForm<Form>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_CHANGE_PASSWORD,
  })
  const change = useChangePassword(() => {
    reset(EMPTY_CHANGE_PASSWORD)
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          change.mutate(values)
        }),
      )}
    >
      <ChangePasswordFields register={register} errors={formState.errors} />

      {change.isError ? (
        <ErrorMessage error={change.error} fallback="No se pudo cambiar la contraseña." />
      ) : null}
      {change.isSuccess ? <FormMessage tone="ok">Contraseña actualizada.</FormMessage> : null}

      <Button
        type="submit"
        className="w-full sm:w-auto sm:self-start"
        disabled={change.isPending}
      >
        <Icon name="key" size={16} />
        <span>{change.isPending ? 'Guardando…' : 'Cambiar contraseña'}</span>
      </Button>
    </form>
  )
}
