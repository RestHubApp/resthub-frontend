import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { PasswordField } from '@/components/PasswordField'
import { TextField } from '@/components/TextField'
import type { LoginFormValues } from './loginSchema'
import { SessionExpiredNotice } from './SessionExpiredNotice'

interface LoginFieldsProps {
  readonly register: UseFormRegister<LoginFormValues>
  readonly errors: FieldErrors<LoginFormValues>
}

/** Aviso de sesión vencida y campos de correo y contraseña del acceso. */
export function LoginFields({ register, errors }: LoginFieldsProps) {
  return (
    <>
      <SessionExpiredNotice />
      <TextField
        id="email"
        label="Correo"
        placeholder="nombre@correo.com"
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        field={register('email')}
        error={errors.email?.message}
      />

      <PasswordField
        id="password"
        label="Contraseña"
        placeholder="Tu contraseña"
        autoComplete="current-password"
        field={register('password')}
        error={errors.password?.message}
      />
    </>
  )
}
