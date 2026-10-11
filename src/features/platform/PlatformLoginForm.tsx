import type { PlatformAdmin } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { PasswordField } from '@/components/PasswordField'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/apiError'
import { usePlatformLogin } from './usePlatformLogin'

interface PlatformLoginFormProps {
  /** La sesión venció sola: se explica antes del formulario. */
  readonly expired: boolean
  readonly onSignedIn: (token: string, admin: PlatformAdmin) => void
}

/** Correo y contraseña de una cuenta de plataforma. Un 429 dice cuándo volver a intentar. */
export function PlatformLoginForm({ expired, onSignedIn }: PlatformLoginFormProps) {
  const { register, errors, access, submit } = usePlatformLogin(onSignedIn)

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={submit}>
      <div hidden={!expired}>
        <FormMessage tone="error">Tu sesión de administración venció. Vuelve a entrar.</FormMessage>
      </div>
      <TextField
        id="platform-email"
        label="Correo"
        placeholder="nombre@resthub.pe"
        type="email"
        inputMode="email"
        autoComplete="username"
        spellCheck={false}
        field={register('email')}
        error={errors.email?.message}
      />
      <PasswordField
        id="platform-password"
        label="Contraseña"
        placeholder="Tu contraseña"
        autoComplete="current-password"
        field={register('password')}
        error={errors.password?.message}
      />
      {access.isError ? (
        <FormMessage tone="error">
          {errorMessage(access.error, 'No se pudo iniciar sesión. Inténtalo de nuevo.')}
        </FormMessage>
      ) : null}
      <Button type="submit" size="lg" className="h-11 w-full" disabled={access.isPending || access.isSuccess}>
        <Icon name="signIn" size={18} />
        <span>{access.isPending ? 'Entrando…' : 'Entrar'}</span>
      </Button>
    </form>
  )
}
