import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { platformLogin } from '../../api/platform'
import type { PlatformAdmin } from '../../api/platformTypes'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import PasswordField from '../../components/PasswordField'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { platformLoginSchema, type PlatformLoginValues } from './platformSchema'

interface PlatformLoginFormProps {
  /** La sesión venció sola: se explica antes del formulario. */
  readonly expired: boolean
  readonly onSignedIn: (token: string, admin: PlatformAdmin) => void
}

/** Correo y contraseña de una cuenta de plataforma. Un 429 dice cuándo volver a intentar. */
export default function PlatformLoginForm({ expired, onSignedIn }: PlatformLoginFormProps) {
  const { register, handleSubmit, formState } = useForm<PlatformLoginValues>({
    resolver: zodResolver(platformLoginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  const acceder = useMutation({
    mutationFn: platformLogin,
    onSuccess: ({ access_token: token, admin }) => {
      onSignedIn(token, admin)
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          acceder.mutate(valores)
        }),
      )}
    >
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
        error={formState.errors.email?.message}
      />
      <PasswordField
        id="platform-password"
        label="Contraseña"
        placeholder="Tu contraseña"
        autoComplete="current-password"
        field={register('password')}
        error={formState.errors.password?.message}
      />
      {acceder.isError ? (
        <FormMessage tone="error">
          {errorMessage(acceder.error, 'No se pudo iniciar sesión. Inténtalo de nuevo.')}
        </FormMessage>
      ) : null}
      <Button type="submit" size="lg" className="h-11 w-full" disabled={acceder.isPending || acceder.isSuccess}>
        <Icon name="entrar" size={18} />
        <span>{acceder.isPending ? 'Entrando…' : 'Entrar'}</span>
      </Button>
    </form>
  )
}
