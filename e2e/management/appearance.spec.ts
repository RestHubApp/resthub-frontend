// La apariencia de la cuenta: el modo, el color, el alto contraste, la letra, el
// tamaño del texto y el orden del menú. Es solo presentación y vive en el
// navegador de cada cuenta: no llama al API ni cambia lo que la cuenta puede abrir.
import type { Locator } from '@playwright/test'

import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'

const MENU = { name: 'Navegación principal' }
const ACTIONS = /^Acciones de /u
const BAR = { name: /^Barra de navegación/u }
const MORE = { name: 'En «Más»' }

test.beforeEach(() => {
  test.slow()
})

/** Los nombres de las pantallas de un grupo del menú, en el orden en que se ven. */
async function namesIn(list: Locator): Promise<string[]> {
  const labels = await list.getByRole('button', { name: ACTIONS }).evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') ?? ''))
  return labels.map((label) => label.replace('Acciones de ', ''))
}

test('GES-35 el encargado cambia el modo, el color, la letra y el tamaño del texto, y se quedan al recargar @mobile', async ({ page, local }) => {
  covers(
    'ruta:/perfil/apariencia',
    'pestanas:shell/appearance/AppearanceView',
    'funcion:apariencia.cambiar-tema',
    'funcion:apariencia.cambiar-letra',
    'funcion:apariencia.restablecer',
  )
  await openAs(page, local.owner, '/perfil')
  await page.getByRole('link', { name: 'Cambiar la apariencia' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Apariencia' })).toBeVisible()
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'terracotta')

  // El color y el modo son cosas distintas: Oliva en oscuro es «olive-dark».
  await page.locator('label').filter({ hasText: 'Oliva' }).click()
  await expect(html).toHaveAttribute('data-theme', 'olive')
  await page.locator('label').filter({ hasText: /^Oscuro/u }).click()
  await expect(page.getByRole('radio', { name: 'Oscuro' })).toBeChecked()
  await expect(html).toHaveAttribute('data-theme', 'olive-dark')
  await page.locator('label').filter({ hasText: 'Terracota' }).click()
  await expect(html).toHaveAttribute('data-theme', 'terracotta-dark')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(23, 19, 17)')

  // La letra y el tamaño están en la pestaña «Lectura».
  await page.getByRole('tab', { name: 'Lectura' }).click()
  await page.locator('label').filter({ hasText: 'Hecha para que no se confundan' }).click()
  await expect(html).toHaveAttribute('data-font', 'atkinson')
  await expect(page.locator('body')).toHaveCSS('font-family', /Atkinson/u)
  await page.locator('label').filter({ hasText: 'Muy grande' }).click()
  await expect(html).toHaveCSS('font-size', '20px')
  await page.locator('label').filter({ hasText: 'Enorme' }).click()
  await expect(html).toHaveCSS('font-size', '24px')
  await page.locator('label').filter({ hasText: 'Muy grande' }).click()
  await evidence(page, 'ges-35-1-modo-letra-tamano')

  // Recargar no lo pierde, y ya viene aplicado desde el primer cuadro.
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'terracotta-dark')
  await expect(html).toHaveAttribute('data-font', 'atkinson')
  await expect(html).toHaveAttribute('data-text-size', 'larger')
  await expect(page.getByRole('radio', { name: 'Oscuro' })).toBeChecked()

  // Otra cuenta en el mismo navegador no hereda nada: tiene la suya.
  await openAs(page, local.waiter, '/perfil/apariencia')
  await expect(page.getByRole('heading', { level: 1, name: 'Apariencia' })).toBeVisible()
  await expect(html).toHaveAttribute('data-theme', 'terracotta')
  await expect(html).toHaveAttribute('data-text-size', 'normal')
  await openAs(page, local.owner, '/perfil/apariencia')
  await expect(html).toHaveAttribute('data-theme', 'terracotta-dark')

  await page.getByRole('button', { name: 'Restablecer apariencia' }).click()
  await expect(html).toHaveAttribute('data-theme', 'terracotta')
  await expect(html).toHaveAttribute('data-font', 'geist')
  await expect(html).toHaveAttribute('data-text-size', 'normal')
  await evidence(page, 'ges-35-2-restablecido')
})

test('GES-36 el encargado reordena el menú y elige la barra de abajo del celular; el mesero solo ordena lo suyo @mobile', async ({ page, local }) => {
  covers('ruta:/perfil/apariencia', 'funcion:apariencia.ordenar-menu', 'funcion:apariencia.barra-inferior', 'funcion:apariencia.restablecer')
  await openAs(page, local.owner, '/perfil/apariencia')
  await expect(page.getByRole('heading', { level: 1, name: 'Apariencia' })).toBeVisible()
  await page.getByRole('tab', { name: 'Menú' }).click()
  const bar = page.getByRole('list', BAR)
  const more = page.getByRole('list', MORE)
  const factoryBar = await namesIn(bar)
  const factoryMore = await namesIn(more)
  const [first = '', second = ''] = factoryBar
  expect(factoryBar).toHaveLength(4)
  expect(factoryMore.length).toBeGreaterThan(1)
  const nav = page.getByRole('navigation', MENU)
  const navLabels = () => nav.getByRole('link').allTextContents()
  const actions = (name: string) => page.getByRole('button', { name: `Acciones de ${name}` })

  // Bajar la primera de la barra la pasa al segundo lugar, y el menú de la página la sigue.
  await actions(first).click()
  await page.getByRole('menuitem', { name: 'Bajar' }).click()
  await expect(page.getByRole('menu')).toBeHidden()
  await expect.poll(() => namesIn(bar)).toEqual([second, first, ...factoryBar.slice(2)])
  await expect(page.getByRole('main').getByRole('status').filter({ hasText: 'lugar' })).toHaveText(`${first}: lugar 2 de 4 en la barra de abajo.`)
  await expect(actions(first)).toBeFocused()
  await expect.poll(async () => (await navLabels()).filter((label) => factoryBar.includes(label)).slice(0, 2)).toEqual([second, first])

  // Subirla otra vez. La barra está llena: no deja poner otra hasta quitar una.
  await actions(first).click()
  await page.getByRole('menuitem', { name: 'Subir' }).click()
  await expect(page.getByRole('menu')).toBeHidden()
  await expect.poll(() => namesIn(bar)).toEqual(factoryBar)
  const [outside = ''] = factoryMore
  await actions(outside).click()
  await expect(page.getByRole('menuitem', { name: 'Poner en la barra de abajo' })).toHaveAttribute('aria-disabled', 'true')
  await page.keyboard.press('Escape')

  // Sacar la tercera de la barra y poner otra en su lugar (caben cuatro).
  const third = factoryBar[2] ?? ''
  await actions(third).click()
  await page.getByRole('menuitem', { name: 'Quitar de la barra de abajo' }).click()
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(page.getByRole('list', { name: /3 de 4/u })).toBeVisible()
  await actions(outside).click()
  await page.getByRole('menuitem', { name: 'Poner en la barra de abajo' }).click()
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(page.getByRole('list', { name: /4 de 4/u })).toBeVisible()
  const chosen = await namesIn(bar)
  expect(chosen).toContain(outside)
  expect(chosen).not.toContain(third)
  await evidence(page, 'ges-35-3-menu')

  // Recargar conserva el orden y la barra. En el celular la barra muestra lo elegido.
  await page.reload()
  await page.getByRole('tab', { name: 'Menú' }).click()
  await expect.poll(() => namesIn(bar)).toEqual(chosen)
  if (test.info().project.name === 'mobile') {
    await expect.poll(navLabels).toEqual(chosen)
  }

  await page.getByRole('button', { name: 'Restablecer apariencia' }).click()
  await expect.poll(() => namesIn(bar)).toEqual(factoryBar)
  await expect.poll(() => namesIn(more)).toEqual(factoryMore)

  // El mesero ve solo lo que puede abrir: nunca las pantallas del encargado.
  await openAs(page, local.waiter, '/perfil/apariencia')
  await page.getByRole('tab', { name: 'Menú' }).click()
  const waiterNames = await namesIn(page.getByRole('main'))
  expect(waiterNames).toContain('Pedidos')
  expect(waiterNames).not.toContain('Personal')
  expect(waiterNames).not.toContain('Caja')
})
