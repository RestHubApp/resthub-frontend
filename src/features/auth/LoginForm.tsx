import { useState } from 'react'

import { ErrorMessage } from '@/components/ErrorMessage'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { TwoFactorCodeField } from '@/components/TwoFactorCodeField'
import { Button } from '@/components/ui/button'
import { useCredentialsForm } from '@/hooks/useCredentialsForm'
import { hasCode } from '@/services/apiError'
import { LoginFields } from './LoginFields'
import { useLogin } from './useLogin'

/**
 * La contraseña temporal venció (401 `temporary_password_expired`, ASVS 6.4.1):
 * volver a probarla no sirve, hay que pedir otra a quien la dio.
 */
const EXPIRED_TEMPORARY_NOTICE =
  'Tu contraseña temporal venció. Pide una nueva a quien te creó la cuenta: el encargado de tu local o, si administras el sistema, otra persona de la administración.'

interface LoginFormProps {
  /** Ruta a la que se va después de entrar. */
  readonly destination: string
}

/**
 * Formulario de acceso: valida, envía las credenciales y muestra el error del
 * servidor. Si la cuenta usa la verificación en dos pasos, el servidor pide el
 * código y aparece el campo para escribirlo.
 */
export function LoginForm({ destination }: LoginFormProps) {
  const access = useLogin(destination)
  const [code, setCode] = useState('')
  const [isAskingCode, setIsAskingCode] = useState(false)
  const { bind, errors, submit } = useCredentialsForm((credentials) => {
    access.mutate(
      isAskingCode && code !== '' ? { ...credentials, otp_code: code } : credentials,
      { onError: (error) => { if (hasCode(error, 'two_factor_required')) setIsAskingCode(true) } },
    )
  })
  // Que pida el código no es un error: lo explica el campo que aparece.
  const hasFailed = access.isError && !hasCode(access.error, 'two_factor_required')

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={submit}>
      <LoginFields bind={bind} errors={errors} />
      {isAskingCode ? <TwoFactorCodeField onChange={setCode} /> : null}

      {hasFailed && hasCode(access.error, 'temporary_password_expired') ? (
        <FormMessage tone="error">{EXPIRED_TEMPORARY_NOTICE}</FormMessage>
      ) : null}
      {hasFailed && !hasCode(access.error, 'temporary_password_expired') ? (
        <ErrorMessage error={access.error} fallback="No se pudo iniciar sesión. Inténtalo de nuevo." />
      ) : null}

      <Button type="submit" className="w-full" disabled={access.isPending}>
        <Icon name="signIn" size={18} />
        <span>{access.isPending ? 'Entrando…' : 'Entrar'}</span>
      </Button>
    </form>
  )
}
