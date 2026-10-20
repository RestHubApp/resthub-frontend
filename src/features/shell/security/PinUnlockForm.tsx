import { zodResolver } from '@hookform/resolvers/zod'

import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { onlyDigits, type PinValues, pinSchema } from '@/services/securityRules'
import { UnlockFooter } from './UnlockFooter'
import { useUnlock } from './useUnlock'

/** Desbloquear con el PIN de 4 a 6 dígitos: lo rápido en el celular del mesero. */
export function PinUnlockForm() {
  const unlock = useUnlock()
  const { register, handleSubmit, formState } = useAppForm<PinValues>({ resolver: zodResolver(pinSchema), defaultValues: { pin: '' } })
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit(handleSubmit((values) => { unlock.mutate({ pin: values.pin }) }))}>
      <TextField
        id="unlock_pin"
        label="PIN"
        type="password"
        icon="key"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        sanitize={onlyDigits}
        field={register('pin')}
        error={formState.errors.pin?.message}
      />
      <UnlockFooter unlock={unlock} />
    </form>
  )
}
