import type { UseFormRegisterReturn } from 'react-hook-form'

import { PasswordField } from '@/components/PasswordField'
import { TextField } from '@/components/TextField'
import type { CredentialErrors, CredentialField } from '@/services/credentialRules'
import { SessionExpiredNotice } from './SessionExpiredNotice'

interface LoginFieldsProps {
  readonly bind: (field: CredentialField) => UseFormRegisterReturn
  readonly errors: CredentialErrors
}

/** Aviso de sesión vencida y campos de correo y contraseña del acceso. */
export function LoginFields({ bind, errors }: LoginFieldsProps) {
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
        field={bind('email')}
        error={errors.email}
      />

      <PasswordField
        id="password"
        label="Contraseña"
        placeholder="Tu contraseña"
        autoComplete="current-password"
        field={bind('password')}
        error={errors.password}
      />
    </>
  )
}
