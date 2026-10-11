import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { LoginFields } from './LoginFields'
import { type LoginFormValues, loginSchema } from './loginSchema'
import { useLogin } from './useLogin'

interface LoginFormProps {
  /** Ruta a la que se va después de entrar. */
  readonly destination: string
}

/** Formulario de acceso: valida, envía las credenciales y muestra el error del servidor. */
export function LoginForm({ destination }: LoginFormProps) {
  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })
  const access = useLogin(destination)

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          access.mutate(values)
        }),
      )}
    >
      <LoginFields register={register} errors={formState.errors} />

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
