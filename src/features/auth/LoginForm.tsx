import { useState } from 'react'

import { ErrorMessage } from '@/components/ErrorMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useCredentialsForm } from '@/hooks/useCredentialsForm'
import { hasCode } from '@/services/apiError'
import { LoginFields } from './LoginFields'
import { TwoFactorLoginField } from './TwoFactorLoginField'
import { useLogin } from './useLogin'

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
      { ...credentials, otp_code: isAskingCode && code !== '' ? code : null },
      { onError: (error) => { if (hasCode(error, 'two_factor_required')) setIsAskingCode(true) } },
    )
  })
  // Que pida el código no es un error: lo explica el campo que aparece.
  const hasFailed = access.isError && !hasCode(access.error, 'two_factor_required')

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={submit}>
      <LoginFields bind={bind} errors={errors} />
      {isAskingCode ? <TwoFactorLoginField onChange={setCode} /> : null}

      {hasFailed ? (
        <ErrorMessage error={access.error} fallback="No se pudo iniciar sesión. Inténtalo de nuevo." />
      ) : null}

      <Button type="submit" className="w-full" disabled={access.isPending}>
        <Icon name="signIn" size={18} />
        <span>{access.isPending ? 'Entrando…' : 'Entrar'}</span>
      </Button>
    </form>
  )
}
