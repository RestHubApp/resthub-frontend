// La cuenta propia y el armazón: Mi perfil, el cambio de contraseña, el enlace
// para saltar al contenido y el widget de accesibilidad.
import { signInByApi } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'

const NEW = 'otra-clave-e2e-2026'
// Con sesión no hay botón flotante: en escritorio el menú se abre desde la fila de la barra lateral.
const OPEN_WIDGET = 'Accesibilidad'
const CLOSE_WIDGET = 'Cerrar menú de accesibilidad'
// El widget pinta el alto contraste con un filtro sobre <html>.
const FILTER = /aws-filter/u

test('ACC-11 el perfil muestra los datos de la cuenta y cambia la contraseña @mobile', async ({ page, local }) => {
  covers('ruta:/perfil', 'funcion:perfil.ver-datos', 'funcion:perfil.cambiar-contrasena', 'estado:perfil.contrasena-error')
  await openAs(page, local.waiter, '/perfil')
  await expect(page.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeVisible()
  const data = page.getByRole('definition')
  await expect(data).toHaveText(['Mesero Prueba', local.waiter.email, 'Mesero', local.name])
  await evidence(page, 'acc-11-perfil')

  await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cambiar contraseña' })
  const actual = dialog.getByLabel('Contraseña actual', { exact: true })
  const fresh = dialog.getByLabel('Nueva contraseña', { exact: true })
  const repeated = dialog.getByLabel('Repite la nueva contraseña', { exact: true })
  const change = dialog.getByRole('button', { name: 'Cambiar contraseña' })

  // Las dos nuevas no coinciden: no sale nada al servidor.
  await actual.fill(local.waiter.password)
  await fresh.fill(NEW)
  await repeated.fill(`${NEW}-x`)
  await change.click()
  await expect(page.getByText('Las dos contraseñas no coinciden')).toBeVisible()

  // La actual no coincide: el servidor lo rechaza y no cambia nada.
  await actual.fill('no-es-la-actual-1')
  await repeated.fill(NEW)
  await change.click()
  await expect(page.getByText('La contraseña actual no es correcta.')).toBeVisible()
  await evidence(page, 'acc-11-contrasena-error')
  await expect(signInByApi(local.http, local.waiter.email, local.waiter.password)).resolves.toMatchObject({ email: local.waiter.email })

  await actual.fill(local.waiter.password)
  await change.click()
  await expect(page.getByText('Contraseña actualizada.')).toBeVisible()
  await expect(actual).toBeEmpty()
  await evidence(page, 'acc-11-contrasena-cambiada')
  // Con la nueva entra; con la anterior, ya no.
  await expect(signInByApi(local.http, local.waiter.email, NEW)).resolves.toMatchObject({ email: local.waiter.email })
  await expect(signInByApi(local.http, local.waiter.email, local.waiter.password)).rejects.toThrow(/401/u)
})

test('ACC-12 «Saltar al contenido» lleva el foco al contenido principal', async ({ page, local }) => {
  covers('funcion:shell.saltar-al-contenido')
  await openAs(page, local.owner, '/tablero')
  await expect(page.getByRole('heading', { name: 'Tablero', level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Saltar al contenido' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await evidence(page, 'acc-12-saltar')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})

test('ACC-13 el menú de accesibilidad se abre, aplica el alto contraste, lo restablece y se cierra', async ({ page, local }) => {
  covers('desplegable:components/AccessibilityWidget', 'funcion:accesibilidad.opcion')
  await openAs(page, local.owner, '/tablero')
  const open = page.getByRole('button', { name: OPEN_WIDGET, exact: true })
  await expect(open).toBeVisible()
  await expect(page.locator('.asw-menu-btn, .a11y-launcher')).toHaveCount(0)
  await open.click()
  const close = page.getByRole('button', { name: CLOSE_WIDGET })
  await expect(close).toBeVisible()
  await evidence(page, 'acc-13-menu')

  await page.getByRole('button', { name: /^(High Contrast|Alto contraste)$/u }).click()
  await expect(page.locator('html')).toHaveClass(FILTER)
  await evidence(page, 'acc-13-alto-contraste')
  await page.getByRole('button', { name: /^(Reset settings|Restablecer configuración)$/u }).click()
  await expect(page.locator('html')).not.toHaveClass(FILTER)

  await close.click()
  await expect(close).toBeHidden()
  await expect(page.locator('.asw-menu-btn')).toBeHidden()
})

test('ACC-14 las opciones del menú de accesibilidad se anuncian con el texto que se ve', async ({ page, local }) => {
  await openAs(page, local.owner, '/tablero')
  await page.getByRole('button', { name: OPEN_WIDGET, exact: true }).click()
  await expect(page.getByRole('button', { name: CLOSE_WIDGET })).toBeVisible()
  for (const name of ['Alto contraste', 'Monocromo', 'Fuente para dislexia', 'Cursor grande']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
  }
  await evidence(page, 'acc-14-opciones-en-espanol')
})
