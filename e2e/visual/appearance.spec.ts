// Regresión visual de «Apariencia»: las tres pestañas (Pantalla, Lectura y Menú),
// la vista previa fija, un modo oscuro, el alto contraste y el texto al 150 %.
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import type { Page } from '@playwright/test'

import { capture, expect, deadline, test } from './capture'

/** Al elegir una opción la página puede quedar desplazada: se vuelve arriba para que cada captura salga igual. */
async function captureFromTop(page: Page, name: string): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, 0)
  })
  await capture(page, name)
}

test('VIS-16 apariencia: modo, color, letra, tamaño del texto y orden del menú', async ({ page, local }) => {
  deadline(120_000)
  covers('ruta:/perfil/apariencia', 'pestanas:shell/appearance/AppearanceView')

  await openAs(page, local.owner, '/perfil/apariencia')
  await expect(page.getByRole('heading', { level: 1, name: 'Apariencia' })).toBeVisible()
  // Las muestras de las letras bajan sus archivos al dibujarse: se espera a que lleguen para que la captura salga igual.
  await page.evaluate(async () => {
    await Promise.all(['"Atkinson Hyperlegible Next Variable"', '"Lexend Variable"'].map((font) => document.fonts.load(`400 16px ${font}`)))
  })
  await capture(page, 'apariencia')

  await page.locator('label').filter({ hasText: /^Oscuro/u }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'terracotta-dark')
  await captureFromTop(page, 'apariencia-noche')

  await page.getByRole('checkbox', { name: /Alto contraste/u }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'contrast-dark')
  await captureFromTop(page, 'apariencia-contraste-oscuro')
  await page.getByRole('checkbox', { name: /Alto contraste/u }).click()
  await page.locator('label').filter({ hasText: /^Claro/u }).click()

  await page.getByRole('tab', { name: 'Lectura' }).click()
  await page.locator('label').filter({ hasText: 'Enorme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'largest')
  await captureFromTop(page, 'apariencia-lectura-enorme')

  await page.locator('label').filter({ hasText: 'Normal (100 %)' }).click()
  await page.getByRole('tab', { name: 'Menú' }).click()
  await expect(page.getByRole('list', { name: /^En la barra de abajo/u })).toBeVisible()
  await captureFromTop(page, 'apariencia-menu')
})
