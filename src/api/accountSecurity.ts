import { queryOptions } from '@tanstack/react-query'

import { setCsrfToken } from '@/services/apiCredentials'
import { send } from './client'
import { staffQueryKey } from './staff'
import type { DeviceSession, StaffAccessTokenResponse, UnlockRequest, UnusedStaff } from './types'

/** Lo que la persona escribe para desbloquear: el PIN o la contraseña. */
export type UnlockCredential = Omit<UnlockRequest, 'rotate_session'>

// La seguridad de la cuenta propia y la del personal: las sesiones abiertas en
// cada dispositivo (RFS-17), la contraseña confirmada antes de una acción
// crítica (RFS-21), las cuentas sin uso (RFS-24) y el bloqueo por
// inactividad con PIN (RFS-29).

export const ownSessionsQueryKey = ['auth', 'sessions'] as const

/** Las sesiones abiertas de la cuenta propia, la usada más recientemente primero. */
export const ownSessionsQuery = queryOptions({
  queryKey: ownSessionsQueryKey,
  queryFn: (): Promise<DeviceSession[]> => send((client) => client.GET('/api/v1/auth/me/sessions')),
})

/** Cierra la sesión de un dispositivo propio (el celular perdido) sin tocar las demás. */
export async function closeOwnSession(sessionRef: string): Promise<void> {
  await send((client) => client.DELETE('/api/v1/auth/me/sessions/{session_ref}', { params: { path: { session_ref: sessionRef } } }))
}

/** Deja abierta solo la sesión de este dispositivo. */
export async function closeOtherSessions(): Promise<void> {
  await send((client) => client.DELETE('/api/v1/auth/me/sessions'))
}

/**
 * Confirma la contraseña: las acciones críticas quedan habilitadas unos minutos
 * en este dispositivo. Con la verificación en dos pasos activa, el servidor
 * pide también el código (`otpCode`): sin él responde 401 `two_factor_required`.
 *
 * La sesión cambia de identificador (`rotate_session: true`, ASVS V7.2.4): el
 * servidor manda un token nuevo y el anterior deja de valer. Devuelve ese token,
 * que quien llama deja en la sesión, y anota el valor anti-CSRF de la cookie nueva.
 */
export async function reauthenticate(password: string, otpCode?: string): Promise<string | null> {
  const body = otpCode === undefined ? { password, rotate_session: true } : { password, otp_code: otpCode, rotate_session: true }
  const confirmed = await send((client) => client.POST('/api/v1/auth/me/reauthenticate', { body }))
  setCsrfToken(confirmed.csrf_token)
  return confirmed.access_token ?? null
}

export function staffSessionsQueryKey(userId: number) {
  return [...staffQueryKey, 'sessions', userId] as const
}

/** Las sesiones abiertas de una cuenta del personal. */
export function staffSessionsQuery(userId: number) {
  return queryOptions({
    queryKey: staffSessionsQueryKey(userId),
    queryFn: (): Promise<DeviceSession[]> =>
      send((client) => client.GET('/api/v1/staff/{user_id}/sessions', { params: { path: { user_id: userId } } })),
  })
}

/** Cierra una sesión de otra cuenta del personal. */
export async function closeStaffSession(userId: number, sessionRef: string): Promise<void> {
  await send((client) =>
    client.DELETE('/api/v1/staff/{user_id}/sessions/{session_ref}', {
      params: { path: { user_id: userId, session_ref: sessionRef } },
    }),
  )
}

/** Cierra todas las sesiones de otra cuenta del personal. */
export async function closeStaffSessions(userId: number): Promise<void> {
  await send((client) => client.DELETE('/api/v1/staff/{user_id}/sessions', { params: { path: { user_id: userId } } }))
}

/** Los días sin uso desde los que una cuenta activa se propone revisar. */
export const UNUSED_DAYS = 60

/** Las cuentas activas sin uso en `UNUSED_DAYS` días o más (RFS-24). */
export const unusedStaffQuery = queryOptions({
  queryKey: [...staffQueryKey, 'unused', UNUSED_DAYS] as const,
  // Es un aviso de más en Personal: si falla, la tarjeta no aparece y el armazón no avisa.
  meta: { background: true },
  queryFn: (): Promise<UnusedStaff[]> =>
    send((client) => client.GET('/api/v1/staff/unused', { params: { query: { days: UNUSED_DAYS } } })),
})

/** Elige o cambia el PIN de desbloqueo (4 a 6 dígitos). */
export async function setOwnPin(pin: string): Promise<void> {
  await send((client) => client.PUT('/api/v1/auth/me/pin', { body: { pin } }))
}

/** Quita el PIN: la sesión bloqueada se abre con la contraseña. */
export async function removeOwnPin(): Promise<void> {
  await send((client) => client.DELETE('/api/v1/auth/me/pin'))
}

/**
 * Desbloquea la sesión con el PIN o con la contraseña. Como al confirmar la
 * contraseña, la sesión cambia de identificador (`rotate_session: true`): devuelve
 * el token nuevo, o nada si la sesión no estaba bloqueada (204, conserva el suyo).
 */
export async function unlockOwnSession(payload: UnlockCredential): Promise<StaffAccessTokenResponse | undefined> {
  const unlocked: StaffAccessTokenResponse | undefined = await send((client) =>
    client.POST('/api/v1/auth/me/unlock', { body: { ...payload, rotate_session: true } }),
  )
  setCsrfToken(unlocked?.csrf_token)
  return unlocked
}
