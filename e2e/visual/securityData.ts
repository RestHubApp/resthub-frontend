// Datos fijos de la seguridad de la cuenta (sesiones por dispositivo, PIN y
// verificación en dos pasos) para la regresión visual. Las sesiones reales
// dependen del navegador y la red de cada corrida; con estas, la pantalla se
// dibuja siempre igual.
import type { Page, Route } from '@playwright/test'

import type { Session } from '../support/api'

const SEEN = '2026-10-17T15:00:00Z'

export const DEVICE_SESSIONS = [
  { id: 'a1b2c3', device: 'Chrome en Windows', network: '190.42.17.x', city: 'Lima', country: 'PE', created_at: SEEN, last_seen_at: SEEN, current: true },
  { id: 'd4e5f6', device: 'Safari en iPhone', network: '181.65.2.x', city: 'Arequipa', country: 'PE', created_at: SEEN, last_seen_at: SEEN, current: false },
]

export const TWO_FACTOR_OFF = { enabled: false, pending: false, recovery_codes_left: 0, recovery_codes_outdated: false }
export const TWO_FACTOR_ON = { enabled: true, pending: false, recovery_codes_left: 10, recovery_codes_outdated: false }

// Una clave de ejemplo, no la de ninguna cuenta.
const EXAMPLE_KEY = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

export const TWO_FACTOR_SETUP = {
  secret: EXAMPLE_KEY,
  otpauth_uri: `otpauth://totp/RestHub%3Amesero%40e2e.resthub.dev?secret=${EXAMPLE_KEY}&issuer=RestHub&digits=6&period=30`,
}

// Con la forma de los del servidor: 24 caracteres en seis grupos de cuatro.
export const RECOVERY_CODES = [
  'm9ep-xbc5-udnv-b8tg-bcqq-chcu',
  'qb5v-d9hx-xv9b-vvpb-hbu6-ekqe',
  'udvk-u5yf-dvvx-gndu-zcvb-wgsy',
  'uq3m-rv8r-nkh4-fz3h-cvkt-s7m2',
  'rkwc-dtqf-3me8-sqb9-yc3u-v475',
  'mmzn-wsv4-rc5c-9jsz-ycb2-zkxv',
  'y5rk-zp7y-na9r-nfwd-sbg3-ke2h',
  'pp86-scfr-puj7-e5q6-ujzq-ny7p',
  '9hec-fehy-has5-vfjk-aequ-nwvm',
  '9ez6-t9wx-y2br-7639-6y4u-pppp',
]

/** Responde siempre lo mismo a esa ruta del API. */
export async function answer(page: Page, path: string, body: unknown, status = 200): Promise<void> {
  await page.route(`**/api/v1${path}`, (route: Route) =>
    status === 204 ? route.fulfill({ status }) : route.fulfill({ status, json: body }),
  )
}

/** La seguridad de la cuenta en «Mi perfil»: dos sesiones y la verificación sin activar. */
export async function profileSecurity(page: Page, twoFactor: unknown = TWO_FACTOR_OFF): Promise<void> {
  await answer(page, '/auth/me/sessions', DEVICE_SESSIONS)
  await answer(page, '/auth/me/two-factor', twoFactor)
}

/** Personal sin cuentas sin uso (la tarjeta no aparece), o con las que se pasen. */
export async function staffSecurity(page: Page, unused: unknown = []): Promise<void> {
  await answer(page, '/staff/unused?days=60', unused)
}

// Lo que la sesión dice del bloqueo, fijo: 10 minutos, sin PIN y sin bloquear
// (`GET /auth/me` lo fija `capture.ts`).
const LOCK_FIELDS = { idle_lock_minutes: 10, has_pin: false, session_locked: false }

/** La sesión guardada en el navegador con el bloqueo fijo, como la relee `GET /auth/me`. */
export function withLockFields(session: Session): Session {
  return { ...session, account: { ...session.account, ...LOCK_FIELDS } }
}
