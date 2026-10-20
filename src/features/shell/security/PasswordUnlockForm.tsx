import { zodResolver } from '@hookform/resolvers/zod'

import { PasswordField } from '@/components/PasswordField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { type CurrentPasswordValues, currentPasswordSchema } from '@/services/securityRules'
import { UnlockFooter } from './UnlockFooter'
import { useUnlock } from './useUnlock'

/** Desbloquear con la contraseña: sin PIN elegido, o si se olvidó. */
export function PasswordUnlockForm() {
  const unlock = useUnlock()
  const { register, handleSubmit, formState } = useAppForm<CurrentPasswordValues>({
    resolver: zodResolver(currentPasswordSchema),
    defaultValues: { password: '' },
  })
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit(handleSubmit((values) => { unlock.mutate({ password: values.password }) }))}>
      <PasswordField
        id="unlock_password"
        label="Tu contraseña"
        autoComplete="current-password"
        field={register('password')}
        error={formState.errors.password?.message}
      />
      <UnlockFooter unlock={unlock} />
    </form>
  )
}
