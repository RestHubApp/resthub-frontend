// Regresión visual del acceso: el formulario del restaurante, el de
// plataforma y a dónde llevan el inicio y una ruta que no existe.
import { cubre } from '../soporte/cobertura'
import { abrirComo } from '../soporte/fixtures'
import { capturar, expect, plazo, test } from './captura'

test('VIS-01 acceso del restaurante y de plataforma, con errores de validación', async ({ page }) => {
  plazo(60_000)
  cubre('ruta:/acceso', 'ruta:/plataforma/acceso')

  await page.goto('/acceso')
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await capturar(page, 'acceso')

  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true')
  await capturar(page, 'acceso-errores')

  await page.goto('/plataforma/acceso')
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  await capturar(page, 'plataforma-acceso')
})

test('VIS-15 términos de uso y política de privacidad', async ({ page }) => {
  plazo(60_000)
  cubre('ruta:/privacidad')

  await page.goto('/privacidad')
  await expect(page.getByRole('heading', { name: 'Términos de uso y política de privacidad', level: 1 })).toBeVisible()
  await capturar(page, 'privacidad')
})

test('VIS-02 el inicio y una ruta que no existe llevan a la pantalla de cada cuenta', async ({ page, local }) => {
  plazo(60_000)
  cubre('ruta:/', 'ruta:/*')

  await page.goto('/')
  await expect(page).toHaveURL(/\/acceso$/u)
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()

  await abrirComo(page, local.cocina, '/')
  await expect(page).toHaveURL(/\/tablero$/u)
  await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible()
  await capturar(page, 'inicio-cocina-tablero')

  // Otra cuenta en el mismo navegador: se sale de la aplicación antes de cambiar la sesión guardada.
  await page.evaluate(() => {
    localStorage.clear()
  })
  await page.goto('about:blank')
  await abrirComo(page, local.mesero, '/no-existe/de-verdad')
  await expect(page).toHaveURL(/\/pedidos$/u)
  await expect(page.getByRole('heading', { name: '4 de 4 mesas libres' })).toBeVisible()
  await capturar(page, 'ruta-inexistente-mesero')
})
