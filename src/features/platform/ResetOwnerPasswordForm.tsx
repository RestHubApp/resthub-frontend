import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { PASSWORD_MUTATION_GC_TIME, platformMutationKeys, resetPlatformOwnerPassword } from '@/api/platform'
import type { PlatformOwner } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { PasswordField } from '@/components/PasswordField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { MIN_PASSWORD } from '@/services/fieldLimits'
import { passwordRule } from '@/services/fieldRules'
import { saveOwner } from './restaurantCache'

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
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useAppForm<ResetValues>({ resolver: zodResolver(schema), defaultValues: { new_password: '' } })
  const reset = useMutation({
    mutationKey: platformMutationKeys.resetOwnerPassword,
    mutationFn: (values: ResetValues) => resetPlatformOwnerPassword(restaurantId, owner.id, values.new_password),
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: (updated) => {
      saveOwner(queryClient, restaurantId, updated)
      onDone()
    },
  })

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(handleSubmit((values) => { reset.mutate(values) }))}>
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
        submit={{ label: 'Restablecer', pendingLabel: 'Guardando…', icon: 'key' }}
      />
    </form>
  )
}
