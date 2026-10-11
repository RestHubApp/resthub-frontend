import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { changeOwnPassword, sessionOf } from '@/api/auth'
import FormMessage from '@/components/FormMessage'
import Icon from '@/components/Icon'
import PasswordField from '@/components/PasswordField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { MIN_PASSWORD } from '@/services/fieldRules'
import { useSession } from '@/store/session'
import {
  type ChangePasswordForm as Formulario,
  changePasswordSchema,
  EMPTY_CHANGE_PASSWORD,
} from './passwordSchema'

type Cambio = Awaited<ReturnType<typeof changeOwnPassword>>

/**
 * Sigue con el token que devolvió el cambio de contraseña.
 *
 * El servidor corta todos los tokens anteriores, el de `origen` incluido, y
 * devuelve el único válido: al quedar guardado, las otras pestañas lo adoptan
 * en vez de seguir con uno que da 401. Sin segundo acceso: la clave nueva no
 * vuelve a viajar.
 */
function seguirConElTokenNuevo(respuesta: Cambio, origen: string | null): 'renovada' | 'cerrada' | 'ajena' {
  // Un servidor viejo respondía 204 sin cuerpo: ahí no hay token que usar.
  const nuevo = (respuesta as Partial<Cambio> | null | undefined)?.access_token ?? ''
  if (origen !== null && nuevo !== '') {
    useSession.getState().renew(origen, nuevo, sessionOf(respuesta))
  }
  const actual = useSession.getState().token
  if (nuevo !== '' && actual === nuevo) {
    return 'renovada'
  }
  // Otra pestaña ya entró con otra sesión y esta la adoptó: cerrar aquí
  // borraría lo guardado y sacaría también a esa otra cuenta.
  if (actual !== null && actual !== origen) {
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
export default function ChangePasswordForm() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState, reset } = useForm<Formulario>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_CHANGE_PASSWORD,
  })

  const cambiar = useMutation({
    // El token se toma al enviar: si otra pestaña entra con otra cuenta
    // mientras tanto, compararlo al terminar pisaría esa sesión ajena.
    mutationFn: async (valores: Formulario) => {
      const origen = useSession.getState().token
      const respuesta = await changeOwnPassword({
        current_password: valores.current_password,
        new_password: valores.new_password,
      })
      return { respuesta, origen }
    },
    onSuccess: ({ respuesta, origen }) => {
      const resultado = seguirConElTokenNuevo(respuesta, origen)
      if (resultado === 'renovada') {
        reset(EMPTY_CHANGE_PASSWORD)
      } else if (resultado === 'cerrada') {
        void navigate('/acceso', { replace: true })
      }
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
