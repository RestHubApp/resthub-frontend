import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormFooter } from '@/components/FormFooter'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { onlyDigits, type TotpValues, totpSchema } from '@/services/securityRules'

interface TwoFactorCodeFormProps {
  readonly mutation: { readonly isPending: boolean; readonly isError: boolean; readonly error: unknown; readonly mutate: (code: string) => void }
  readonly onCancel: () => void
}

/** El primer código de la aplicación, que confirma que quedó bien configurada. */
export function TwoFactorCodeForm({ mutation, onCancel }: TwoFactorCodeFormProps) {
  const { register, handleSubmit, formState } = useForm<TotpValues>({ resolver: zodResolver(totpSchema), defaultValues: { code: '' } })
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit(handleSubmit((values) => { mutation.mutate(values.code) }))}>
      <TextField
        id="two_factor_code"
        label="Código de la aplicación"
        hint="Los 6 dígitos que muestra ahora la aplicación."
        icon="key"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        sanitize={onlyDigits}
        field={register('code')}
        error={formState.errors.code?.message}
      />
      <FormFooter mutation={mutation} failureText="No se pudo activar la verificación." onCancel={onCancel} submit={{ label: 'Activar', pendingLabel: 'Activando…', icon: 'confirm' }} />
    </form>
  )
}
