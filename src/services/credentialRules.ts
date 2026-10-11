import { MAX_PASSWORD } from './fieldLimits'

// Las reglas del acceso (de restaurante y de plataforma), sin Zod ni React Hook
// Form: la pantalla de acceso es lo primero que baja una persona nueva y esas
// dos librerías pesan más que el resto del formulario. Al entrar no se exige el mínimo de la contraseña: la
// respuesta del servidor ya dice si no coincide. El máximo sí, porque el
// servidor rechaza una más larga antes de mirarla. El correo se revisa por
// su forma; si no existe, también lo dice el servidor.

export type CredentialField = 'email' | 'password'
export type CredentialErrors = Partial<Record<CredentialField, string>>

export interface Credentials {
  readonly email: string
  readonly password: string
}

const NO_SPACES = /^\S+$/u

function isEmail(value: string): boolean {
  const [local = '', domain = '', ...rest] = value.split('@')
  const hasDomain = domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.')
  return rest.length === 0 && local !== '' && hasDomain && NO_SPACES.test(value)
}

/** El correo como lo recibe el servidor: sin espacios alrededor y en minúsculas. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/** El mensaje de un campo, o `undefined` si está bien. */
export function credentialError(field: CredentialField, value: string): string | undefined {
  if (field === 'email') {
    return isEmail(normalizeEmail(value)) ? undefined : 'Escribe un correo válido, como nombre@correo.com'
  }
  if (value === '') {
    return 'Escribe tu contraseña'
  }
  return value.length > MAX_PASSWORD ? `Usa como máximo ${String(MAX_PASSWORD)} caracteres` : undefined
}

/** Todos los errores del formulario; vacío si se puede enviar. */
export function validateCredentials(values: Credentials): CredentialErrors {
  const email = credentialError('email', values.email)
  const password = credentialError('password', values.password)
  return {
    ...(email === undefined ? {} : { email }),
    ...(password === undefined ? {} : { password }),
  }
}
