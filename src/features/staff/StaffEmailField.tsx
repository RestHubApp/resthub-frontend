import type { UseFormRegisterReturn } from 'react-hook-form'

import { ReadOnlyField } from '@/components/ReadOnlyField'
import { TextField } from '@/components/TextField'

interface StaffEmailFieldProps {
  /** Solo al crear. Al editar, el correo se muestra y no se cambia. */
  readonly field?: UseFormRegisterReturn | undefined
  readonly error?: string | undefined
  /** El correo de una cuenta que ya existe. */
  readonly fixedEmail?: string | undefined
}

/** El correo de una cuenta del personal: editable al crear, fijo al editar. */
export function StaffEmailField({ field, error, fixedEmail }: StaffEmailFieldProps) {
  if (field === undefined) {
    return (
      <ReadOnlyField
        label="Correo"
        value={fixedEmail ?? ''}
        hint="Es con lo que entra a RestHub: no se cambia."
      />
    )
  }
  return (
    <TextField
      id="email"
      label="Correo"
      placeholder="nombre@correo.com"
      type="email"
      inputMode="email"
      autoComplete="off"
      spellCheck={false}
      hint="Con este correo entra a RestHub."
      field={field}
      error={error}
    />
  )
}
