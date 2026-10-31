import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormFooter } from '@/components/FormFooter'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { onlyDigits, pinRule } from '@/services/securityRules'
import * as icons from '@/components/icons'

const schema = z
  .object({ pin: pinRule, confirm: z.string() })
  .refine((values) => values.pin === values.confirm, { message: 'Los dos PIN no coinciden', path: ['confirm'] })

type PinFormValues = z.infer<typeof schema>

interface PinFormProps {
  readonly mutation: { readonly isPending: boolean; readonly isError: boolean; readonly error: unknown; readonly mutate: (pin: string) => void }
  readonly onCancel: () => void
}

/** El PIN nuevo, escrito dos veces: no se ve mientras se escribe. */
export function PinForm({ mutation, onCancel }: PinFormProps) {
  const { register, handleSubmit, formState } = useAppForm<PinFormValues>({ resolver: zodResolver(schema), defaultValues: { pin: '', confirm: '' } })
  const pinProps = { type: 'password', icon: icons.key, inputMode: 'numeric', autoComplete: 'off', maxLength: 6, sanitize: onlyDigits } as const
  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={onSubmit(handleSubmit((values) => { mutation.mutate(values.pin) }))}>
      <TextField id="new_pin" label="PIN nuevo" hint="De 4 a 6 dígitos." field={register('pin')} error={formState.errors.pin?.message} {...pinProps} />
      <TextField id="confirm_pin" label="Repite el PIN" field={register('confirm')} error={formState.errors.confirm?.message} {...pinProps} />
      <FormFooter mutation={mutation} failureText="No se pudo guardar el PIN." onCancel={onCancel} submit={{ label: 'Guardar PIN', icon: icons.key }} />
    </form>
  )
}
