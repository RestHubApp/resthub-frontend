// La cuenta propia y el armazón: Mi perfil, el cambio de contraseña, el enlace
// para saltar al contenido y el widget de accesibilidad.
import { entrarPorApi } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'

const NUEVA = 'otra-clave-e2e-2026'
const ABRIR_WIDGET = 'Abrir menú de accesibilidad'
const CERRAR_WIDGET = 'Cerrar menú de accesibilidad'
// El widget pinta el alto contraste con un filtro sobre <html>.
const FILTRO = /aws-filter/u

test('ACC-11 el perfil muestra los datos de la cuenta y cambia la contraseña @movil', async ({ page, local }) => {
  cubre('ruta:/perfil', 'funcion:perfil.ver-datos', 'funcion:perfil.cambiar-contrasena', 'estado:perfil.contrasena-error')
  await abrirComo(page, local.mesero, '/perfil')
  await expect(page.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeVisible()
  const datos = page.getByRole('definition')
  await expect(datos).toHaveText(['Mesero Prueba', local.mesero.email, 'Mesero', local.nombre])
  await evidencia(page, 'acc-11-perfil')

  const actual = page.getByLabel('Contraseña actual', { exact: true })
  const nueva = page.getByLabel('Nueva contraseña', { exact: true })
  const repetida = page.getByLabel('Repite la nueva contraseña', { exact: true })
  const cambiar = page.getByRole('button', { name: 'Cambiar contraseña' })

  // Las dos nuevas no coinciden: no sale nada al servidor.
  await actual.fill(local.mesero.password)
  await nueva.fill(NUEVA)
  await repetida.fill(`${NUEVA}-x`)
  await cambiar.click()
  await expect(page.getByText('Las dos contraseñas no coinciden')).toBeVisible()

  // La actual no coincide: el servidor lo rechaza y no cambia nada.
  await actual.fill('no-es-la-actual-1')
  await repetida.fill(NUEVA)
  await cambiar.click()
  await expect(page.getByText('La contraseña actual no es correcta.')).toBeVisible()
  await evidencia(page, 'acc-11-contrasena-error')
  await expect(entrarPorApi(local.http, local.mesero.email, local.mesero.password)).resolves.toMatchObject({ email: local.mesero.email })

  await actual.fill(local.mesero.password)
  await cambiar.click()
  await expect(page.getByText('Contraseña actualizada.')).toBeVisible()
  await expect(actual).toBeEmpty()
  await evidencia(page, 'acc-11-contrasena-cambiada')
  // Con la nueva entra; con la anterior, ya no.
  await expect(entrarPorApi(local.http, local.mesero.email, NUEVA)).resolves.toMatchObject({ email: local.mesero.email })
  await expect(entrarPorApi(local.http, local.mesero.email, local.mesero.password)).rejects.toThrow(/401/u)
})

test('ACC-12 «Saltar al contenido» lleva el foco al contenido principal', async ({ page, local }) => {
  cubre('funcion:shell.saltar-al-contenido')
  await abrirComo(page, local.encargado, '/tablero')
  await expect(page.getByRole('heading', { name: 'Tablero', level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  const saltar = page.getByRole('link', { name: 'Saltar al contenido' })
  await expect(saltar).toBeFocused()
  await expect(saltar).toBeInViewport()
  await evidencia(page, 'acc-12-saltar')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})

test('ACC-13 el menú de accesibilidad se abre, aplica el alto contraste, lo restablece y se cierra', async ({ page, local }) => {
  cubre('desplegable:components/AccessibilityWidget', 'funcion:accesibilidad.opcion')
  await abrirComo(page, local.encargado, '/tablero')
  const abrir = page.getByRole('button', { name: ABRIR_WIDGET })
  await expect(abrir).toBeVisible()
  await abrir.click()
  const cerrar = page.getByRole('button', { name: CERRAR_WIDGET })
  await expect(cerrar).toBeVisible()
  await evidencia(page, 'acc-13-menu')

  await page.getByRole('button', { name: /^(High Contrast|Alto contraste)$/u }).click()
  await expect(page.locator('html')).toHaveClass(FILTRO)
  await evidencia(page, 'acc-13-alto-contraste')
  await page.getByRole('button', { name: /^(Reset settings|Restablecer configuración)$/u }).click()
  await expect(page.locator('html')).not.toHaveClass(FILTRO)

  await cerrar.click()
  await expect(cerrar).toBeHidden()
  await expect(abrir).toHaveAttribute('aria-expanded', 'false')
})

test('ACC-14 las opciones del menú de accesibilidad se anuncian con el texto que se ve', async ({ page, local }) => {
  await abrirComo(page, local.encargado, '/tablero')
  await page.getByRole('button', { name: ABRIR_WIDGET }).click()
  await expect(page.getByRole('button', { name: CERRAR_WIDGET })).toBeVisible()
  for (const nombre of ['Alto contraste', 'Monocromo', 'Fuente para dislexia', 'Cursor grande']) {
    await expect(page.getByRole('button', { name: nombre, exact: true })).toBeVisible()
  }
  await evidencia(page, 'acc-14-opciones-en-espanol')
})
