// Regresión visual de «Apariencia»: la pantalla con el tema de siempre y con
// Noche, con las muestras de cada tema, las letras y el menú de la cuenta.
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { capture, expect, deadline, test } from './capture'

test('VIS-16 apariencia: los temas, la letra, el tamaño del texto y el orden del menú', async ({ page, local }) => {
  deadline(90_000)
  covers('ruta:/perfil/apariencia')

  await openAs(page, local.owner, '/perfil/apariencia')
  await expect(page.getByRole('heading', { level: 1, name: 'Apariencia' })).toBeVisible()
  // Las muestras de las letras bajan sus archivos al dibujarse: se espera a que lleguen para que la captura salga igual.
  await page.evaluate(async () => {
    await Promise.all(['"Atkinson Hyperlegible Next Variable"', '"Lexend Variable"'].map((font) => document.fonts.load(`400 16px ${font}`)))
  })
  await capture(page, 'apariencia')

  await page.locator('label').filter({ hasText: 'Fondo oscuro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night')
  await capture(page, 'apariencia-noche')
})
