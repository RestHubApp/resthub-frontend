import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import type { PlatformOwner } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { PasswordField } from '@/components/PasswordField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { MIN_PASSWORD } from '@/services/fieldLimits'
import { passwordRule } from '@/services/fieldRules'
import * as icons from '@/components/icons'
import { useResetOwnerPassword } from './useResetOwnerPassword'

const schema = z.object({ new_password: passwordRule })

type ResetValues = z.infer<typeof schema>

interface ResetOwnerPasswordFormProps {
  readonly restaurantId: number
  readonly owner: PlatformOwner
  readonly onDone: () => void
}

/**
 * Una contraseña temporal para un encargado que no puede entrar (RFS-04).
 * Se la dicta quien atiende el soporte; al entrar, la persona tiene que
 * cambiarla, y sus sesiones abiertas se cierran.
 */
export function ResetOwnerPasswordForm({ restaurantId, owner, onDone }: ResetOwnerPasswordFormProps) {
  const { register, handleSubmit, formState } = useAppForm<ResetValues>({ resolver: zodResolver(schema), defaultValues: { new_password: '' } })
  const reset = useResetOwnerPassword({ restaurantId, owner, onDone })

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(handleSubmit((values) => { reset.mutate(values.new_password) }))}>
      <PasswordField
        id="owner-temporary-password"
        label="Contraseña temporal"
        placeholder={`Mínimo ${String(MIN_PASSWORD)} caracteres`}
        autoComplete="new-password"
        hint="La persona la cambia al entrar. Sus sesiones abiertas se cierran."
        field={register('new_password')}
        error={formState.errors.new_password?.message}
      />
      <FormFooter
        mutation={reset}
        failureText="No se pudo restablecer la contraseña."
        onCancel={onDone}
        submit={{ label: 'Restablecer', pendingLabel: 'Guardando…', icon: icons.key }}
      />
    </form>
  )
}
