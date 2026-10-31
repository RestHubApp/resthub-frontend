import { useRef } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import { FormMessage } from './FormMessage'
import { TextField } from './TextField'

interface TwoFactorCodeFieldProps {
  readonly onChange: (code: string) => void
  readonly error?: string | undefined
}

/**
 * El segundo paso del acceso y de «Confirma tu contraseña» (RFS-22): el código
 * de la aplicación de verificación o, sin el celular, uno de los códigos de
 * recuperación. Aparece recién cuando el servidor dice que la cuenta lo usa:
 * lleva el foco al aparecer y lo anuncia, porque quien usa un lector de
 * pantalla no ve que apareció.
 */
export function TwoFactorCodeField({ onChange, error }: TwoFactorCodeFieldProps) {
  const hasFocused = useRef(false)
  // Con la forma de `register(...)`, que es lo que espera el campo; el código no pasa por React Hook Form.
  const field: UseFormRegisterReturn = {
    name: 'otp_code',
    ref: (element: HTMLInputElement | null) => {
      if (element === null || hasFocused.current) return
      hasFocused.current = true
      element.focus()
    },
    onBlur: () => Promise.resolve(),
    onChange: (event: { readonly target: { readonly value: string } }) => {
      onChange(event.target.value.trim())
      return Promise.resolve()
    },
  }
  return (
    <>
      <FormMessage tone="info">Tu cuenta usa la verificación en dos pasos: escribe el código de tu aplicación para seguir.</FormMessage>
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
        error={error}
      />
    </>
  )
}
