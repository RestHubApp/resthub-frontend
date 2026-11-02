// Regresión visual de la cuenta del mesero: su perfil, el panel «Más» del
// celular y el aviso al cerrar sesión con un pedido que espera señal, también
// desde la puerta «Antes de empezar».
import type { Role } from '../../src/api/types'
import { NEW_SECRET, signInByApi, unique } from '../support/api'
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { api } from '../support/management'
import { capture, captureWindow, isMobile, expect, deadline, test } from './capture'
import { ownerOf, orderInQueue } from './prepare'
import { profileSecurity, withLockFields } from './securityData'

test('VIS-12 el perfil, el panel de la cuenta y el aviso de pedidos sin enviar al salir', async ({ page, local }) => {
  deadline(90_000)
  covers('ruta:/perfil', 'dialogo:auth/ChangePasswordDialog', 'hoja:shell/MoreSheet', 'confirmacion:shell/SessionActions')

  // Las sesiones y la verificación en dos pasos, con datos fijos: las reales cambian con cada corrida.
  await profileSecurity(page)
  await openAs(page, withLockFields(local.waiter), '/perfil')
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()
  await expect(page.getByText('mesero@e2e.resthub.dev')).toBeVisible()
  await capture(page, 'perfil')

  await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
  const password = page.getByRole('dialog', { name: 'Cambiar contraseña' })
  await captureWindow(password, 'dialogo-cambiar-contrasena')
  await page.keyboard.press('Escape')
  await expect(password).toBeHidden()

  await orderInQueue(page, { owner: ownerOf(local.waiter), table: local.table('3'), dish: local.dish('Lomo saltado') })
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()

  if (isMobile()) {
    // En el celular la cuenta vive en el último botón de la barra inferior.
    await page.getByRole('button', { name: /^(?:Más|Cuenta)$/u }).click()
    const sheet = page.getByRole('dialog', { name: /^(?:Más|Cuenta)$/u })
    await captureWindow(sheet, 'hoja-mas')
    await sheet.getByRole('button', { name: 'Cerrar sesión' }).click()
  } else {
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  }
  const notice = page.getByRole('alertdialog', { name: '¿Cerrar sesión con pedidos sin enviar?' })
  await expect(notice).toContainText('Mesa 3')
  await captureWindow(notice, 'confirmar-cerrar-sesion')
  await notice.getByRole('button', { name: 'Cancelar' }).click()
  await expect(notice).toBeHidden()
  // La sesión sigue abierta: en el celular se vuelve a la hoja, en escritorio al perfil.
  const round = isMobile()
    ? page.getByRole('dialog', { name: /^(?:Más|Cuenta)$/u })
    : page.getByRole('heading', { level: 1, name: 'Mi perfil' })
  await expect(round).toBeVisible()
})

test('VIS-12b el aviso de pedidos sin enviar al salir desde «Antes de empezar»', async ({ page, local }) => {
  deadline(90_000)
  covers('confirmacion:shell/TermsSignOut')
  // Una cuenta nueva, sin los términos aceptados: entra a la puerta «Antes de empezar».
  const roles = await api(local).list<Role>('/roles')
  const email = `nueva-${unique()}@e2e.resthub.dev`
  await api(local).post('/staff', {
    email,
    full_name: 'Mesera Nueva',
    role_id: roles.find((role) => role.kind === 'waiter')?.id,
    password: NEW_SECRET,
  })
  const newcomer = await signInByApi(email, NEW_SECRET, { acceptTerms: false })
  await openAs(page, newcomer, '/pedidos')
  await expect(page.getByRole('heading', { level: 1, name: 'Antes de empezar' })).toBeVisible()
  await orderInQueue(page, { owner: ownerOf(newcomer), table: local.table('3'), dish: local.dish('Lomo saltado') })
  await expect(page.getByRole('heading', { level: 1, name: 'Antes de empezar' })).toBeVisible()
  await page.getByRole('button', { name: 'Salir', exact: true }).click()
  const notice = page.getByRole('alertdialog', { name: '¿Cerrar sesión con pedidos sin enviar?' })
  await expect(notice).toContainText('Mesa 3')
  await captureWindow(notice, 'confirmar-salir-de-terminos')
  await notice.getByRole('button', { name: 'Cancelar' }).click()
  await expect(notice).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: 'Antes de empezar' })).toBeVisible()
})
