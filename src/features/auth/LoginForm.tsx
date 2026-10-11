import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useCredentialsForm } from '@/hooks/useCredentialsForm'
import { errorMessage } from '@/services/apiError'
import { LoginFields } from './LoginFields'
import { useLogin } from './useLogin'

interface LoginFormProps {
  /** Ruta a la que se va después de entrar. */
  readonly destination: string
}

/** Formulario de acceso: valida, envía las credenciales y muestra el error del servidor. */
export function LoginForm({ destination }: LoginFormProps) {
  const access = useLogin(destination)
  const { bind, errors, submit } = useCredentialsForm((credentials) => {
    access.mutate(credentials)
  })

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={submit}>
      <LoginFields bind={bind} errors={errors} />

      {access.isError ? (
        <FormMessage tone="error">
          {errorMessage(access.error, 'No se pudo iniciar sesión. Inténtalo de nuevo.')}
        </FormMessage>
      ) : null}

      <Button type="submit" size="lg" className="h-11 w-full" disabled={access.isPending}>
        <Icon name="signIn" size={18} />
        <span>{access.isPending ? 'Entrando…' : 'Entrar'}</span>
      </Button>
    </form>
  )
}
