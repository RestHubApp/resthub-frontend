import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { changeOwnPassword, sessionOf } from '../../api/auth'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PasswordField from '../../components/PasswordField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { MIN_PASSWORD } from '../../services/fieldRules'
import { useSession } from '../../store/session'
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
  const navigate = useNavigate()
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
    onSuccess: (respuesta) => {
      // El servidor corta todos los tokens anteriores, este incluido, y
      // devuelve el único válido: se cambia aquí y, al quedar guardado, las
      // otras pestañas lo adoptan en vez de seguir con uno que da 401. Sin
      // segundo acceso: la clave nueva no vuelve a viajar.
      const { token, renew } = useSession.getState()
      // Un servidor viejo respondía 204 sin cuerpo: ahí no hay token que usar.
      const nuevo = (respuesta as Partial<typeof respuesta> | null | undefined)?.access_token ?? ''
      if (token !== null && nuevo !== '') {
        renew(token, nuevo, sessionOf(respuesta))
      }
      if (nuevo !== '' && useSession.getState().token === nuevo) {
        reset(EMPTY_CHANGE_PASSWORD)
        return
      }
      // Sin token nuevo, o la sesión ya no era esta (se cerró o cambió en otra
      // pestaña): seguir con el token viejo solo daría 401. Se cierra y se
      // vuelve al acceso con el aviso.
      useSession.getState().signOutAfterPasswordChange()
      void navigate('/acceso', { replace: true })
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
