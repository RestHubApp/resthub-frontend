import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { changeOwnPassword } from '../../api/auth'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PasswordField from '../../components/PasswordField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { MIN_PASSWORD } from '../../services/fieldRules'
import {
  type ChangePasswordForm as Formulario,
  changePasswordSchema,
  EMPTY_CHANGE_PASSWORD,
} from './passwordSchema'

/**
 * Cambio de la contraseña propia.
 *
 * Pide la actual aunque la sesion este abierta: un celular prestado o una
 * laptop sin bloquear no deberian alcanzar para quedarse con la cuenta.
 */
export default function ChangePasswordForm() {
  const { register, handleSubmit, formState, reset } = useForm<Formulario>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_CHANGE_PASSWORD,
  })

  const cambiar = useMutation({
    mutationFn: (valores: Formulario) =>
      changeOwnPassword({
        current_password: valores.current_password,
        new_password: valores.new_password,
      }),
    onSuccess: () => {
      reset(EMPTY_CHANGE_PASSWORD)
    },
  })

  const errores = formState.errors

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          cambiar.mutate(valores)
        }),
      )}
    >
      <PasswordField
        id="current_password"
        label="Contraseña actual"
        autoComplete="current-password"
        field={register('current_password')}
        error={errores.current_password?.message}
      />
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <PasswordField
          id="new_password"
          label="Nueva contraseña"
          autoComplete="new-password"
          hint={`Al menos ${String(MIN_PASSWORD)} caracteres.`}
          field={register('new_password')}
          error={errores.new_password?.message}
        />
        <PasswordField
          id="confirm_password"
          label="Repite la nueva contraseña"
          autoComplete="new-password"
          field={register('confirm_password')}
          error={errores.confirm_password?.message}
        />
      </div>

      {cambiar.isError ? (
        <FormMessage tone="error">
          {errorMessage(cambiar.error, 'No se pudo cambiar la contraseña.')}
        </FormMessage>
      ) : null}
      {cambiar.isSuccess ? <FormMessage tone="ok">Contraseña actualizada.</FormMessage> : null}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full sm:h-10 sm:w-auto sm:self-start sm:px-4"
        disabled={cambiar.isPending}
      >
        <Icon name="llave" size={16} />
        <span>{cambiar.isPending ? 'Guardando…' : 'Cambiar contraseña'}</span>
      </Button>
    </form>
  )
}
