// RFS-17, RFS-21, RFS-22, RFS-24 y RFS-29: la seguridad de la cuenta contra el
// backend real. Las sesiones por dispositivo y cerrarlas, la contraseña
// confirmada antes de una acción crítica, el PIN y el bloqueo de la sesión, la
// verificación en dos pasos, y en Personal las sesiones de otra persona y las
// cuentas sin uso.
import type { Page } from '@playwright/test'

import { API_ORIGIN, newHttp, signInByApi, type Session } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'
import { totpCode } from '../support/totp'

const API = `${API_ORIGIN}/api/v1`

test.beforeEach(() => {
  test.slow()
})

/** Si el token todavía abre la sesión en el servidor. */
async function isOpen(token: string): Promise<boolean> {
  const http = await newHttp()
  const response = await http.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
  await http.dispose()
  return response.ok()
}

/** Entra por el formulario, como en un dispositivo nuevo: la contraseña todavía no está confirmada. */
async function signInByForm(page: Page, session: Session): Promise<void> {
  await page.goto('/acceso')
  await page.getByLabel('Correo').fill(session.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(session.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(/\/acceso$/u)
}

test('SEG-01 la cuenta ve sus sesiones abiertas, cierra la de otro dispositivo y luego las demás', async ({ page, local }) => {
  covers('confirmacion:auth/security/OwnSessionsCard')
  const http = await newHttp()
  const phone = await signInByApi(http, local.waiter.email, local.waiter.password)
  const laptop = await signInByApi(http, local.waiter.email, local.waiter.password)
  await http.dispose()

  await openAs(page, local.waiter, '/perfil')
  const list = page.getByRole('list', { name: 'Sesiones abiertas' })
  await expect(list.getByRole('listitem')).toHaveCount(3)
  await expect(list.getByText('Este dispositivo')).toHaveCount(1)
  await evidence(page, 'seg-01-sesiones')

  await list.getByRole('button', { name: /^Cerrar la sesión de / }).first().click()
  await expect(list.getByRole('listitem')).toHaveCount(2)

  await page.getByRole('button', { name: 'Cerrar las demás' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cerrar las demás' }).click()
  await expect(list.getByRole('listitem')).toHaveCount(1)
  expect(await isOpen(phone.token)).toBe(false)
  expect(await isOpen(laptop.token)).toBe(false)
  expect(await isOpen(local.waiter.token)).toBe(true)
})

test('SEG-02 elegir un PIN pide la contraseña; la sesión se bloquea y se abre con el PIN', async ({ page, local }) => {
  covers('dialogo:auth/security/PinCard', 'dialogo:shell/security/ReauthenticationDialog', 'confirmacion:auth/security/PinCard')
  await signInByForm(page, local.waiter)
  await page.goto('/perfil')

  await page.getByRole('button', { name: 'Elegir un PIN' }).click()
  const pin = page.getByRole('dialog', { name: 'Elegir un PIN' })
  await pin.getByLabel('PIN nuevo').fill('4321')
  await pin.getByLabel('Repite el PIN').fill('4321')
  await pin.getByRole('button', { name: 'Guardar PIN' }).click()
  // El dispositivo es nuevo: guardar el PIN pide antes la contraseña, y después sigue solo.
  const password = page.getByRole('dialog', { name: 'Confirma tu contraseña' })
  await password.getByLabel('Tu contraseña').fill(local.waiter.password)
  await password.getByRole('button', { name: 'Confirmar' }).click()
  await expect(pin).toBeHidden()
  await expect(page.getByRole('button', { name: 'Cambiar PIN' })).toBeVisible()

  await page.getByRole('button', { name: 'Bloquear ahora' }).click()
  await expect(page.getByRole('heading', { name: 'Sesión bloqueada' })).toBeVisible()
  await evidence(page, 'seg-02-bloqueada')
  await page.getByLabel('PIN').fill('0000')
  await page.getByRole('button', { name: 'Desbloquear' }).click()
  await expect(page.getByText('El PIN no es correcto. Te quedan 2 intentos.')).toBeVisible()
  await page.getByLabel('PIN').fill('4321')
  await page.getByRole('button', { name: 'Desbloquear' }).click()
  await expect(page.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Quitar PIN' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Quitar PIN' }).click()
  await expect(page.getByRole('button', { name: 'Elegir un PIN' })).toBeVisible()
})

test('SEG-03 activa la verificación en dos pasos, entra con el código y la desactiva', async ({ page, local }) => {
  covers('hoja:auth/security/TwoFactorSheet', 'confirmacion:auth/security/TwoFactorCard')
  await openAs(page, local.waiter, '/perfil')

  await page.getByRole('button', { name: 'Activar' }).click()
  const sheet = page.getByRole('dialog', { name: 'Activar la verificación en dos pasos' })
  await expect(sheet.getByRole('img', { name: 'Código QR para la aplicación de verificación' })).toBeVisible()
  const secret = (await sheet.locator('.font-mono').innerText()).replaceAll(' ', '')
  await sheet.getByLabel('Código de la aplicación').fill(totpCode(secret))
  await sheet.getByRole('button', { name: 'Activar' }).click()
  const codes = page.getByRole('list', { name: 'Códigos de recuperación' })
  await expect(codes.getByRole('listitem')).toHaveCount(10)
  await evidence(page, 'seg-03-codigos')
  await page.getByRole('button', { name: 'Ya los guardé' }).click()
  await expect(page.getByText('Activa', { exact: true })).toBeVisible()

  // Desde otro navegador: sin el código no entra; con el siguiente, sí.
  const other = await page.context().browser()?.newPage()
  expect(other).toBeDefined()
  if (other !== undefined) {
    await other.goto('/acceso')
    await other.getByLabel('Correo').fill(local.waiter.email)
    await other.getByLabel('Contraseña', { exact: true }).fill(local.waiter.password)
    await other.getByRole('button', { name: 'Entrar' }).click()
    await other.getByLabel('Código de verificación').fill(totpCode(secret, 1))
    await other.getByRole('button', { name: 'Entrar' }).click()
    await expect(other).not.toHaveURL(/\/acceso$/u)
    await other.close()
  }

  await page.getByRole('button', { name: 'Desactivar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Desactivar' }).click()
  await expect(page.getByText('Sin activar', { exact: true })).toBeVisible()
})

test('SEG-04 el encargado cierra las sesiones de otra persona y revisa las cuentas sin uso', async ({ page, local }) => {
  covers('hoja:staff/StaffSessionsSheet', 'confirmacion:staff/UnusedStaffRow')
  const { user } = local.kitchen.account
  // El servidor cuenta 60 días reales sin uso: la lista se responde con la cuenta de cocina.
  await page.route('**/api/v1/staff/unused?days=60', (route) =>
    route.fulfill({ json: [{ member: { ...user, is_active: true, must_change_password: false, deactivation_reason: '', created_at: '2026-07-01T15:00:00Z' }, last_activity_at: null, unused_days: 108 }] }),
  )
  await openAs(page, local.owner, '/personal')

  await page.getByRole('button', { name: `Más acciones de ${local.waiter.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sesiones abiertas' }).click()
  const sheet = page.getByRole('dialog', { name: `Sesiones de ${local.waiter.name}` })
  await expect(sheet.getByRole('listitem')).not.toHaveCount(0)
  await sheet.getByRole('button', { name: 'Cerrar todas' }).click()
  await expect(sheet.getByText('Sin sesiones abiertas')).toBeVisible()
  expect(await isOpen(local.waiter.token)).toBe(false)
  await page.keyboard.press('Escape')

  const unused = page.getByRole('list', { name: 'Cuentas sin uso' })
  await unused.getByRole('button', { name: 'Desactivar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Desactivar' }).click()
  await expect.poll(() => isOpen(local.kitchen.token)).toBe(false)
})
