import { useState, type SyntheticEvent } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import {
  credentialError,
  normalizeEmail,
  validateCredentials,
  type CredentialErrors,
  type CredentialField,
  type Credentials,
} from '@/services/credentialRules'

// Lo único que se lee del evento de un campo: el texto que tiene.
interface FieldEvent {
  readonly target: { readonly value: string }
}

function textOf(form: FormData, name: CredentialField): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

/** Quita el mensaje de `field` y deja el nuevo, si lo hay. */
function withMessage(errors: CredentialErrors, field: CredentialField, value: string): CredentialErrors {
  const others = Object.fromEntries(Object.entries(errors).filter(([name]) => name !== field))
  const message = credentialError(field, value)
  return message === undefined ? others : { ...others, [field]: message }
}

/**
 * Un formulario de correo y contraseña sin librería de formularios: campos sin
 * controlar que se leen al enviar. Un campo se revisa al salir de él y, una vez
 * con error, en cada cambio hasta que queda bien. `onValid` recibe el correo
 * ya normalizado (sin espacios y en minúsculas).
 */
export function useCredentialsForm(onValid: (credentials: Credentials) => void) {
  const [errors, setErrors] = useState<CredentialErrors>({})

  const check = (field: CredentialField, value: string) => {
    setErrors((current) => withMessage(current, field, value))
  }

  // Con la forma de `register(...)` de React Hook Form, que es lo que esperan los campos.
  const bind = (field: CredentialField): UseFormRegisterReturn => ({
    name: field,
    ref: () => undefined,
    onBlur: (event: FieldEvent) => {
      check(field, event.target.value)
      return Promise.resolve()
    },
    onChange: (event: FieldEvent) => {
      if (errors[field] !== undefined) {
        check(field, event.target.value)
      }
      return Promise.resolve()
    },
  })

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values = { email: textOf(form, 'email'), password: textOf(form, 'password') }
    const found = validateCredentials(values)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      onValid({ email: normalizeEmail(values.email), password: values.password })
    }
  }

  return { bind, errors, submit }
}
