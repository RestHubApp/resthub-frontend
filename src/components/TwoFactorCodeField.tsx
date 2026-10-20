import type { UseFormRegisterReturn } from 'react-hook-form'

import { TextField } from './TextField'

interface TwoFactorCodeFieldProps {
  readonly onChange: (code: string) => void
}

/**
 * El segundo paso del acceso y de «Confirma tu contraseña» (RFS-22): el código
 * de la aplicación de verificación o, sin el celular, uno de los códigos de
 * recuperación. Aparece recién cuando el servidor dice que la cuenta lo usa.
 */
export function TwoFactorCodeField({ onChange }: TwoFactorCodeFieldProps) {
  // Con la forma de `register(...)`, que es lo que espera el campo; el código no pasa por React Hook Form.
  const field: UseFormRegisterReturn = {
    name: 'otp_code',
    ref: () => undefined,
    onBlur: () => Promise.resolve(),
    onChange: (event: { readonly target: { readonly value: string } }) => {
      onChange(event.target.value.trim())
      return Promise.resolve()
    },
  }
  return (
    <TextField
      id="otp_code"
      label="Código de verificación"
      hint="Los 6 dígitos de tu aplicación, o uno de tus códigos de recuperación."
      icon="key"
      autoComplete="one-time-code"
      // Lo mismo que acepta el servidor: un código de recuperación mide 29 con guiones y se puede escribir con espacios.
      maxLength={64}
      spellCheck={false}
      field={field}
    />
  )
}
