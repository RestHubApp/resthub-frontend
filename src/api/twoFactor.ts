import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type { TwoFactorSetup, TwoFactorStatus } from './types'

// La verificación en dos pasos de la cuenta propia (RFS-22): un código de una
// aplicación como Google Authenticator además de la contraseña.

export const twoFactorQueryKey = ['auth', 'two-factor'] as const

export const twoFactorQuery = queryOptions({
  queryKey: twoFactorQueryKey,
  queryFn: (): Promise<TwoFactorStatus> => send((client) => client.GET('/api/v1/auth/me/two-factor')),
})

/** Un secreto nuevo, pendiente hasta confirmarlo con el primer código. */
export async function beginTwoFactor(): Promise<TwoFactorSetup> {
  return send((client) => client.POST('/api/v1/auth/me/two-factor/setup'))
}

/** Activa la verificación con el primer código y devuelve los códigos de recuperación (se muestran una vez). */
export async function confirmTwoFactor(code: string): Promise<string[]> {
  const { recovery_codes } = await send((client) => client.POST('/api/v1/auth/me/two-factor/confirm', { body: { code } }))
  return recovery_codes
}

/** Códigos de recuperación nuevos: los anteriores dejan de servir. */
export async function renewRecoveryCodes(): Promise<string[]> {
  const { recovery_codes } = await send((client) => client.POST('/api/v1/auth/me/two-factor/recovery-codes'))
  return recovery_codes
}

export async function disableTwoFactor(): Promise<void> {
  await send((client) => client.DELETE('/api/v1/auth/me/two-factor'))
}
