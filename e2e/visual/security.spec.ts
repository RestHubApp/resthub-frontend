// Regresión visual de la seguridad de la cuenta: las sesiones abiertas, el PIN
// y el bloqueo de la sesión, la verificación en dos pasos, «Confirma tu
// contraseña» y, en Personal, las sesiones y los accesos de otra persona y las
// cuentas sin uso.
// El API de estas funciones se responde con datos fijos (`securityData.ts`).
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { capture, captureWindow, expect, deadline, test } from './capture'
import { answer, DEVICE_SESSIONS, profileSecurity, RECOVERY_CODES, staffSecurity, TWO_FACTOR_ON, TWO_FACTOR_SETUP, withLockFields } from './securityData'

test('VIS-26 sesiones abiertas, PIN, «Confirma tu contraseña» y bloqueo de la sesión', async ({ page, local }) => {
  deadline(90_000)
  covers('confirmacion:auth/security/OwnSessionsCard', 'dialogo:auth/security/PinCard', 'dialogo:shell/security/ReauthenticationDialog', 'confirmacion:auth/security/PinCard')

  await profileSecurity(page)
  await openAs(page, withLockFields(local.waiter), '/perfil')
  await expect(page.getByRole('list', { name: 'Sesiones abiertas' })).toContainText('Safari en iPhone')

  await page.getByRole('button', { name: 'Cerrar las demás' }).click()
  const closeOthers = page.getByRole('alertdialog', { name: '¿Cerrar las sesiones de los demás dispositivos?' })
  await captureWindow(closeOthers, 'confirmar-cerrar-otras-sesiones')
  await closeOthers.getByRole('button', { name: 'Cancelar' }).click()

  // La primera vez el servidor pide la contraseña; confirmada, el PIN se guarda.
  let wasAsked = false
  await page.route('**/api/v1/auth/me/pin', async (route) => {
    if (wasAsked) return route.fulfill({ status: 204 })
    wasAsked = true
    return route.fulfill({ status: 403, json: { detail: 'Confirma tu contraseña para seguir.', code: 'reauthentication_required' } })
  })
  await answer(page, '/auth/me/reauthenticate', { reauthenticated_at: '2026-10-17T15:00:00Z', valid_until: '2026-10-17T15:05:00Z' })
  await page.getByRole('button', { name: 'Elegir un PIN' }).click()
  const pin = page.getByRole('dialog', { name: 'Elegir un PIN' })
  await captureWindow(pin, 'dialogo-elegir-pin')
  await pin.getByLabel('PIN nuevo').fill('4321')
  await pin.getByLabel('Repite el PIN').fill('4321')
  await pin.getByRole('button', { name: 'Guardar PIN' }).click()
  const password = page.getByRole('dialog', { name: 'Confirma tu contraseña' })
  await captureWindow(password, 'dialogo-confirmar-contrasena')
  await password.getByLabel('Tu contraseña').fill('resthub123')
  await password.getByRole('button', { name: 'Confirmar' }).click()
  await expect(pin).toBeHidden()

  await page.getByRole('button', { name: 'Quitar PIN' }).click()
  const removePin = page.getByRole('alertdialog', { name: '¿Quitar el PIN?' })
  await captureWindow(removePin, 'confirmar-quitar-pin')
  await removePin.getByRole('button', { name: 'Cancelar' }).click()

  await answer(page, '/auth/me/lock', null, 204)
  await page.getByRole('button', { name: 'Bloquear ahora' }).click()
  await expect(page.getByRole('heading', { name: 'Sesión bloqueada' })).toBeVisible()
  await capture(page, 'sesion-bloqueada')
})

test('VIS-27 activar la verificación en dos pasos y desactivarla', async ({ page, local }) => {
  deadline(90_000)
  covers('hoja:auth/security/TwoFactorSheet', 'confirmacion:auth/security/TwoFactorCard')

  await profileSecurity(page)
  await answer(page, '/auth/me/two-factor/setup', TWO_FACTOR_SETUP)
  await answer(page, '/auth/me/two-factor/confirm', { recovery_codes: RECOVERY_CODES })
  await openAs(page, withLockFields(local.waiter), '/perfil')

  await page.getByRole('button', { name: 'Activar' }).click()
  const sheet = page.getByRole('dialog', { name: 'Activar la verificación en dos pasos' })
  await expect(sheet.getByRole('img', { name: 'Código QR para la aplicación de verificación' })).toBeVisible()
  await captureWindow(sheet, 'hoja-activar-dos-pasos')

  await sheet.getByLabel('Código de la aplicación').fill('123456')
  await profileSecurity(page, TWO_FACTOR_ON)
  await sheet.getByRole('button', { name: 'Activar' }).click()
  const codes = page.getByRole('dialog', { name: 'Códigos de recuperación' })
  await expect(codes.getByRole('list', { name: 'Códigos de recuperación' })).toContainText('k7m2p-qrs4t')
  await captureWindow(codes, 'hoja-codigos-de-recuperacion')
  await codes.getByRole('button', { name: 'Ya los guardé' }).click()

  await page.getByRole('button', { name: 'Desactivar' }).click()
  const disable = page.getByRole('alertdialog', { name: '¿Desactivar la verificación en dos pasos?' })
  await captureWindow(disable, 'confirmar-desactivar-dos-pasos')
  await disable.getByRole('button', { name: 'Cancelar' }).click()
})

test('VIS-28 las sesiones y los accesos de otra persona y las cuentas sin uso, en Personal', async ({ page, local }) => {
  deadline(90_000)
  covers('hoja:staff/StaffSessionsSheet', 'confirmacion:staff/UnusedStaffRow', 'hoja:staff/StaffAccessSheet')

  const { user } = local.waiter.account
  const member = { ...user, is_active: true, must_change_password: false, deactivation_reason: '', created_at: '2026-07-01T15:00:00Z' }
  await staffSecurity(page, [{ member, last_activity_at: null, unused_days: 108 }])
  await answer(page, `/staff/${String(member.id)}/sessions`, DEVICE_SESSIONS.map((session) => ({ ...session, current: false })))
  await openAs(page, local.owner, '/personal')

  const unused = page.getByRole('list', { name: 'Cuentas sin uso' })
  await expect(unused).toContainText('Nunca entró')
  await unused.getByRole('button', { name: 'Desactivar' }).click()
  const deactivate = page.getByRole('alertdialog', { name: `¿Desactivar a ${local.waiter.name}?` })
  await captureWindow(deactivate, 'confirmar-desactivar-cuenta-sin-uso')
  await deactivate.getByRole('button', { name: 'Cancelar' }).click()
  await capture(page, 'personal-cuentas-sin-uso')

  await page.getByRole('button', { name: `Más acciones de ${local.waiter.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sesiones abiertas' }).click()
  const sheet = page.getByRole('dialog', { name: `Sesiones de ${local.waiter.name}` })
  await expect(sheet).toContainText('Safari en iPhone')
  await captureWindow(sheet, 'hoja-sesiones-de-otra-persona')
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()

  await page.getByRole('button', { name: `Más acciones de ${local.waiter.name}` }).click()
  await page.getByRole('menuitem', { name: 'Accesos' }).click()
  const accesses = page.getByRole('dialog', { name: `Accesos de ${local.waiter.name}` })
  await expect(accesses).toContainText('Dispositivo nuevo')
  await captureWindow(accesses, 'hoja-accesos-de-otra-persona')
})
