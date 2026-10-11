import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { changeOwnPassword, sessionOf } from '@/api/auth'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { PasswordField } from '@/components/PasswordField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { MIN_PASSWORD } from '@/services/fieldRules'
import { paths } from '@/services/paths'
import { useSession } from '@/store/session'
import {
  type ChangePasswordForm as Form,
  changePasswordSchema,
  EMPTY_CHANGE_PASSWORD,
} from './passwordSchema'

type Change = Awaited<ReturnType<typeof changeOwnPassword>>

/**
 * Sigue con el token que devolvió el cambio de contraseña.
 *
 * El servidor corta todos los tokens anteriores, el de `origen` incluido, y
 * devuelve el único válido: al quedar guardado, las otras pestañas lo adoptan
 * en vez de seguir con uno que da 401. Sin segundo acceso: la clave nueva no
 * vuelve a viajar.
 */
function followWithNewToken(response: Change, origin: string | null): 'renovada' | 'cerrada' | 'ajena' {
  // Un servidor viejo respondía 204 sin cuerpo: ahí no hay token que usar.
  const fresh = (response as Partial<Change> | null | undefined)?.access_token ?? ''
  if (origin !== null && fresh !== '') {
    useSession.getState().renew(origin, fresh, sessionOf(response))
  }
  const actual = useSession.getState().token
  if (fresh !== '' && actual === fresh) {
    return 'renovada'
  }
  // Otra pestaña ya entró con otra sesión y esta la adoptó: cerrar aquí
  // borraría lo guardado y sacaría también a esa otra cuenta.
  if (actual !== null && actual !== origin) {
    return 'ajena'
  }
  // Sin token nuevo, o la sesión se cerró en otra pestaña: seguir con el
  // token viejo solo daría 401. Se cierra y se vuelve al acceso con el aviso.
  useSession.getState().signOutAfterPasswordChange()
  return 'cerrada'
}

/**
 * Cambio de la contraseña propia.
 *
 * Pide la actual aunque la sesion este abierta: un celular prestado o una
 * laptop sin bloquear no deberian alcanzar para quedarse con la cuenta.
 */
export function ChangePasswordForm() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState, reset } = useForm<Form>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_CHANGE_PASSWORD,
  })

  const change = useMutation({
    // El token se toma al enviar: si otra pestaña entra con otra cuenta
    // mientras tanto, compararlo al terminar pisaría esa sesión ajena.
    mutationFn: async (values: Form) => {
      const origin = useSession.getState().token
      const response = await changeOwnPassword({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      return { response, origin }
    },
    onSuccess: ({ response, origin }) => {
      const result = followWithNewToken(response, origin)
      if (result === 'renovada') {
        reset(EMPTY_CHANGE_PASSWORD)
      } else if (result === 'cerrada') {
        void navigate(paths.login, { replace: true })
      }
    },
  })

  const errors = formState.errors

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

      {change.isError ? (
        <FormMessage tone="error">
          {errorMessage(change.error, 'No se pudo cambiar la contraseña.')}
        </FormMessage>
      ) : null}
      {change.isSuccess ? <FormMessage tone="ok">Contraseña actualizada.</FormMessage> : null}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full sm:h-10 sm:w-auto sm:self-start sm:px-4"
        disabled={change.isPending}
      >
        <Icon name="key" size={16} />
        <span>{change.isPending ? 'Guardando…' : 'Cambiar contraseña'}</span>
      </Button>
    </form>
  )
}
