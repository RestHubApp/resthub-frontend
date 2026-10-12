// La apariencia de la cuenta: el tema, la letra, el tamaño del texto y el orden
// del menú. Es solo presentación y vive en el navegador de cada cuenta: no
// llama al API ni cambia lo que la cuenta puede abrir.
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'

const MENU = { name: 'Navegación principal' }
const NAMES = '[id^="menu-name-"]'

test.beforeEach(() => {
  test.slow()
})

test('GES-35 el encargado cambia el tema, la letra y el tamaño del texto, y se quedan al recargar @mobile', async ({ page, local }) => {
  covers(
    'ruta:/perfil/apariencia',
    'funcion:apariencia.cambiar-tema',
    'funcion:apariencia.cambiar-letra',
    'funcion:apariencia.restablecer',
  )
  await openAs(page, local.owner, '/perfil')
  await page.getByRole('link', { name: 'Cambiar la apariencia' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Apariencia' })).toBeVisible()
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'terracotta')

  // Se elige tocando la tarjeta; el tema se aplica al instante.
  await page.locator('label').filter({ hasText: 'Fondo oscuro' }).click()
  await expect(page.getByRole('radio', { name: /Noche/u })).toBeChecked()
  await expect(html).toHaveAttribute('data-theme', 'night')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(23, 19, 17)')
  await page.locator('label').filter({ hasText: 'Hecha para que no se confundan' }).click()
  await expect(html).toHaveAttribute('data-font', 'atkinson')
  await expect(page.locator('body')).toHaveCSS('font-family', /Atkinson/u)
  await page.locator('label').filter({ hasText: 'Muy grande' }).click()
  await expect(html).toHaveCSS('font-size', '20px')
  await evidence(page, 'ges-35-1-tema-letra-tamano')

  // Recargar no lo pierde, y ya viene aplicado desde el primer cuadro.
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'night')
  await expect(html).toHaveAttribute('data-font', 'atkinson')
  await expect(html).toHaveAttribute('data-text-size', 'larger')
  await expect(page.getByRole('radio', { name: /Noche/u })).toBeChecked()

  // Otra cuenta en el mismo navegador no hereda nada: tiene la suya.
  await openAs(page, local.waiter, '/perfil/apariencia')
  await expect(page.getByRole('heading', { level: 1, name: 'Apariencia' })).toBeVisible()
  await expect(html).toHaveAttribute('data-theme', 'terracotta')
  await expect(html).toHaveAttribute('data-text-size', 'normal')
  await openAs(page, local.owner, '/perfil/apariencia')
  await expect(html).toHaveAttribute('data-theme', 'night')

  await page.getByRole('button', { name: 'Volver a todo lo de siempre' }).click()
  await expect(html).toHaveAttribute('data-theme', 'terracotta')
  await expect(html).toHaveAttribute('data-font', 'geist')
  await expect(html).toHaveAttribute('data-text-size', 'normal')
  await evidence(page, 'ges-35-2-restablecido')
})

test('GES-36 el encargado reordena el menú y elige la barra de abajo del celular; el mesero solo ordena lo suyo @mobile', async ({ page, local }) => {
  covers('ruta:/perfil/apariencia', 'funcion:apariencia.ordenar-menu', 'funcion:apariencia.barra-inferior', 'funcion:apariencia.restablecer')
  await openAs(page, local.owner, '/perfil/apariencia')
  await expect(page.getByRole('heading', { level: 1, name: 'Apariencia' })).toBeVisible()
  const names = () => page.locator(NAMES).allTextContents()
  const factory = await names()
  const [first = '', second = '', third = ''] = factory
  expect(factory.length).toBeGreaterThan(5)
  const nav = page.getByRole('navigation', MENU)
  const navLabels = () => nav.getByRole('link').allTextContents()

  // Bajar la primera la pasa al segundo lugar, y el menú de la página la sigue.
  await page.getByRole('button', { name: `Bajar ${first}` }).click()
  await expect(page.locator(NAMES).nth(1)).toHaveText(first)
  await expect(page.getByRole('main').getByRole('status').filter({ hasText: 'lugar' })).toHaveText(`${first}: lugar 2 de ${String(factory.length)}.`)
  await expect(page.getByRole('button', { name: `Bajar ${first}` })).toBeFocused()
  await expect.poll(async () => (await navLabels()).slice(0, 2)).toEqual([second, first])

  // Subirla otra vez; luego sacar la tercera de la barra de abajo y poner la quinta (caben cuatro).
  await page.getByRole('button', { name: `Subir ${first}` }).click()
  await expect.poll(names).toEqual(factory)
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(4)
  const fifth = factory[4] ?? ''
  await expect(page.getByRole('checkbox', { name: fifth })).toBeDisabled()
  await page.getByRole('checkbox', { name: third }).click()
  await expect(page.getByText('En la barra de abajo del celular: 3 de 4.')).toBeVisible()
  await page.getByRole('checkbox', { name: fifth }).click()
  await expect(page.getByText(/4 de 4/u)).toBeVisible()
  await evidence(page, 'ges-35-3-menu')

  // Recargar conserva el orden y la barra. En el celular la barra muestra lo elegido.
  await page.reload()
  await expect(page.getByRole('checkbox', { name: fifth })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: third })).not.toBeChecked()
  if (test.info().project.name === 'mobile') {
    await expect.poll(navLabels).toEqual([first, second, factory[3] ?? '', fifth])
  }

  await page.getByRole('button', { name: 'Restablecer el menú' }).click()
  await expect.poll(names).toEqual(factory)
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(4)
  await expect(page.getByRole('checkbox', { name: third })).toBeChecked()

  // El mesero ve solo lo que puede abrir: nunca las pantallas del encargado.
  await openAs(page, local.waiter, '/perfil/apariencia')
  const waiterNames = await names()
  expect(waiterNames).toContain('Pedidos')
  expect(waiterNames).not.toContain('Personal')
  expect(waiterNames).not.toContain('Caja')
})
