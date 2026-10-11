// La cuenta propia y el armazón: Mi perfil, el cambio de contraseña, el enlace
// para saltar al contenido y el widget de accesibilidad.
import { signInByApi } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'

const NEW = 'otra-clave-e2e-2026'
const OPEN_WIDGET = 'Abrir menú de accesibilidad'
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

  const actual = page.getByLabel('Contraseña actual', { exact: true })
  const fresh = page.getByLabel('Nueva contraseña', { exact: true })
  const repeated = page.getByLabel('Repite la nueva contraseña', { exact: true })
  const change = page.getByRole('button', { name: 'Cambiar contraseña' })

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
  const open = page.getByRole('button', { name: OPEN_WIDGET })
  await expect(open).toBeVisible()
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
  await expect(open).toHaveAttribute('aria-expanded', 'false')
})

test('ACC-14 las opciones del menú de accesibilidad se anuncian con el texto que se ve', async ({ page, local }) => {
  await openAs(page, local.owner, '/tablero')
  await page.getByRole('button', { name: OPEN_WIDGET }).click()
  await expect(page.getByRole('button', { name: CLOSE_WIDGET })).toBeVisible()
  for (const name of ['Alto contraste', 'Monocromo', 'Fuente para dislexia', 'Cursor grande']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
  }
  await evidence(page, 'acc-14-opciones-en-espanol')
})
