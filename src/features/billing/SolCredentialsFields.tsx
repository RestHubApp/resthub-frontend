import { useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'

import { FormMessage } from '@/components/FormMessage'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import * as icons from '@/components/icons'
import type { SettingsValues } from './billingSettingsSchema'

interface SolCredentialsFieldsProps {
  readonly form: Pick<UseFormReturn<SettingsValues>, 'register' | 'control' | 'formState' | 'resetField'>
  /** Si el local ya tiene usuario y clave SOL guardados. */
  readonly hasCredentials: boolean
  /** El RUC guardado: con otro, las credenciales cargadas ya no sirven. */
  readonly savedRuc: string
}

// SUNAT recién revisa el usuario y la clave al recibir un comprobante: guardarlos no los valida.
const VALIDATION_HINT = 'SUNAT valida el usuario y la clave SOL al emitir el primer comprobante: si están mal, ese comprobante sale rechazado con el motivo.'
const HINT_CLASS = 'm-0 text-xs text-muted-foreground'

/**
 * El usuario y la clave SOL del local. Guardados no se muestran nunca: solo se
 * dice que están cargados y se ofrece reemplazarlos. Si cambia el RUC, hay que
 * volver a escribirlos.
 */
export function SolCredentialsFields({ form, hasCredentials, savedRuc }: SolCredentialsFieldsProps) {
  const { register, control, formState, resetField } = form
  const [isReplacing, setIsReplacing] = useState(false)
  const hasRucChanged = useWatch({ control, name: 'ruc' }).trim() !== savedRuc
  const canKeep = hasCredentials && !hasRucChanged

  if (canKeep && !isReplacing) {
    return (
      <div className="flex flex-col gap-2">
        <FormMessage
          tone="ok"
          icon={icons.key}
          action={<Button type="button" variant="outline" size="sm" onClick={() => {
            setIsReplacing(true)
          }}>Reemplazar</Button>}
        >
          Usuario y clave SOL cargados.
        </FormMessage>
        <p className={HINT_CLASS}>{VALIDATION_HINT}</p>
      </div>
    )
  }
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 text-sm font-medium">Credenciales SOL de SUNAT</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="fiscal-sol-usuario" label="Usuario SOL" autoComplete="off" spellCheck={false} hint="El usuario secundario, sin el RUC delante." field={register('sol_user')} error={formState.errors.sol_user?.message} />
        <TextField id="fiscal-sol-clave" label="Clave SOL" type="password" autoComplete="new-password" icon={icons.lock} field={register('sol_password')} error={formState.errors.sol_password?.message} />
      </div>
      {canKeep ? (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => {
          resetField('sol_user')
          resetField('sol_password')
          setIsReplacing(false)
        }}>
          Conservar las cargadas
        </Button>
      ) : null}
      <p className={HINT_CLASS}>{VALIDATION_HINT}</p>
    </fieldset>
  )
}
