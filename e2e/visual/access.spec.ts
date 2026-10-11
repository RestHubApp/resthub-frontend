// Regresión visual del acceso: el formulario del restaurante, el de
// plataforma y a dónde llevan el inicio y una ruta que no existe.
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { capture, expect, deadline, test } from './capture'

test('VIS-01 acceso del restaurante y de plataforma, con errores de validación', async ({ page }) => {
  deadline(60_000)
  covers('ruta:/acceso', 'ruta:/plataforma/acceso')

  await page.goto('/acceso')
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await capture(page, 'acceso')

  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true')
  await capture(page, 'acceso-errores')

  await page.goto('/plataforma/acceso')
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  await capture(page, 'plataforma-acceso')
})

test('VIS-15 términos de uso y política de privacidad', async ({ page }) => {
  deadline(60_000)
  covers('ruta:/privacidad')

  await page.goto('/privacidad')
  await expect(page.getByRole('heading', { name: 'Términos de uso y política de privacidad', level: 1 })).toBeVisible()
  await capture(page, 'privacidad')
})

test('VIS-02 el inicio y una ruta que no existe llevan a la pantalla de cada cuenta', async ({ page, local }) => {
  deadline(60_000)
  covers('ruta:/', 'ruta:/*')

  await page.goto('/')
  await expect(page).toHaveURL(/\/acceso$/u)
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()

  await openAs(page, local.kitchen, '/')
  await expect(page).toHaveURL(/\/tablero$/u)
  await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible()
  await capture(page, 'inicio-cocina-tablero')

  // Otra cuenta en el mismo navegador: se sale de la aplicación antes de cambiar la sesión guardada.
  await page.evaluate(() => {
    localStorage.clear()
  })
  await page.goto('about:blank')
  await openAs(page, local.waiter, '/no-existe/de-verdad')
  await expect(page).toHaveURL(/\/pedidos$/u)
  await expect(page.getByRole('heading', { name: '4 de 4 mesas libres' })).toBeVisible()
  await capture(page, 'ruta-inexistente-mesero')
})
