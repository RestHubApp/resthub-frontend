// La paleta «Buscar o ir a…» (Ctrl/Cmd+K y el botón de la lupa) y «Apariencia
// rápida»: ir a una pantalla, lanzar una acción, cambiar el modo, lo que ve
// cada rol y la salida con pedidos sin enviar. La paleta nunca ejecuta nada:
// solo navega, y la pantalla de destino abre su diálogo.
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'
import { api } from '../support/management'
import { enqueueOrders, ownerOf, savedQueue, withoutOrdersSending } from '../support/platform'

const PALETTE = { name: 'Buscar o ir a…' }

test.beforeEach(() => {
  test.slow()
})

test('PAL-01 el encargado abre la paleta, busca sin tildes y llega a una pantalla @mobile', async ({ page, local }) => {
  covers(
    'dialogo:shell/quick/QuickPalette',
    'funcion:paleta.abrir',
    'funcion:paleta.ir-a-pantalla',
    'rol:encargado',
  )
  await openAs(page, local.owner, '/pedidos')
  await expect(page.getByRole('heading', { level: 1, name: 'Pedidos' })).toBeVisible()
  if (test.info().project.name === 'desktop') {
    await page.keyboard.press('Control+K')
  } else {
    await page.getByRole('button', PALETTE).click()
  }
  const palette = page.getByRole('dialog', PALETTE)
  const search = palette.getByRole('combobox')
  await expect(search).toBeFocused()
  await search.fill('MENU')
  await expect(palette.getByRole('option', { name: /^Menú/u })).toBeVisible()
  await expect(palette.getByRole('option', { name: /^Caja/u })).toHaveCount(0)
  await evidence(page, 'pal-01-busqueda')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/menu$/u)
  await expect(palette).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: 'Menú' })).toBeVisible()
})

test('PAL-02 una acción de la paleta solo navega y la pantalla abre su diálogo vacío @mobile', async ({ page, local }) => {
  covers('funcion:paleta.lanzar-accion')
  await openAs(page, local.owner, '/pedidos')
  await page.getByRole('button', PALETTE).click()
  const palette = page.getByRole('dialog', PALETTE)
  await palette.getByRole('option', { name: /^Nuevo plato/u }).click()
  await expect(page.getByRole('dialog', { name: 'Nuevo plato' })).toBeVisible()
  await expect(page).toHaveURL(/\/menu\?accion=nuevo-plato$/u)
  // Al cerrar el diálogo el parámetro se borra de la dirección, para que «Atrás» no lo vuelva a abrir.
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/menu$/u)
  await evidence(page, 'pal-02-accion')
})

test('PAL-03 un valor raro en ?accion= no abre nada @mobile', async ({ page, local }) => {
  covers('funcion:paleta.accion-desconocida')
  await openAs(page, local.owner, '/menu?accion=borrar-todo')
  await expect(page.getByRole('heading', { level: 1, name: 'Menú' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('PAL-04 con la caja abierta, ?accion=abrir-caja no abre nada y se borra de la dirección @mobile', async ({ page, local }) => {
  covers('funcion:paleta.accion-no-aplica')
  await api(local, local.owner).post('/cash/open', { opening_amount: '100.00', notes: '' })
  await openAs(page, local.owner, '/caja?accion=abrir-caja')
  await expect(page.getByRole('heading', { level: 1, name: 'Caja' })).toBeVisible()
  await expect(page.getByText('Turno en curso')).toBeVisible()
  await expect(page).toHaveURL(/\/caja$/u)
  await expect(page.getByRole('dialog', { name: 'Abrir caja' })).toHaveCount(0)
})

test('PAL-05 cambiar el modo desde la paleta y desde «Apariencia rápida» usa las preferencias de la cuenta @mobile', async ({ page, local }) => {
  covers('funcion:paleta.cambiar-modo', 'hoja:shell/quick/QuickAppearanceButton', 'funcion:paleta.apariencia-rapida')
  await openAs(page, local.owner, '/pedidos')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'terracotta')

  await page.getByRole('button', PALETTE).click()
  await page.getByRole('dialog', PALETTE).getByRole('option', { name: /^Modo oscuro/u }).click()
  await expect(html).toHaveAttribute('data-theme', 'terracotta-dark')
  await expect(page.getByRole('dialog', PALETTE)).toBeHidden()

  await page.getByRole('button', { name: 'Apariencia rápida' }).first().click()
  const sheet = page.getByRole('dialog', { name: 'Apariencia rápida' })
  await sheet.locator('label').filter({ hasText: /^Claro$/u }).click()
  await expect(html).toHaveAttribute('data-theme', 'terracotta')
  await sheet.getByRole('button', { name: 'Texto más grande' }).click()
  await expect(html).toHaveAttribute('data-text-size', 'large')
  await evidence(page, 'pal-05-apariencia-rapida')
  await sheet.getByRole('link', { name: 'Más ajustes de apariencia' }).click()
  await expect(page).toHaveURL(/\/perfil\/apariencia$/u)
})

test('PAL-06 el mesero no ve Caja ni Personal ni acciones del encargado @mobile', async ({ page, local }) => {
  covers('funcion:paleta.por-rol', 'rol:mesero')
  await openAs(page, local.waiter, '/pedidos')
  await page.getByRole('button', PALETTE).click()
  const palette = page.getByRole('dialog', PALETTE)
  await expect(palette.getByRole('option', { name: /^Pedidos/u })).toBeVisible()
  await expect(palette.getByRole('option', { name: /^Caja/u })).toHaveCount(0)
  await expect(palette.getByRole('option', { name: /^Personal/u })).toHaveCount(0)
  await expect(palette.getByRole('group', { name: 'Acciones' })).toHaveCount(0)
  await expect(palette.getByRole('option', { name: /^Mi perfil/u })).toBeVisible()
})

test('PAL-07 cerrar sesión desde la paleta con pedidos sin enviar avisa y conserva la cola @mobile', async ({ page, local }) => {
  covers('confirmacion:shell/quick/QuickPaletteHost', 'funcion:paleta.cerrar-sesion')
  await withoutOrdersSending(page)
  await openAs(page, local.waiter, '/perfil')
  await enqueueOrders(page, ownerOf(local.waiter), [{ table: local.table('2'), dish: local.dish('Lomo saltado') }])
  await page.reload()
  await page.getByRole('button', PALETTE).click()
  await page.getByRole('dialog', PALETTE).getByRole('option', { name: /^Cerrar sesión/u }).click()
  const notice = page.getByRole('alertdialog', { name: '¿Cerrar sesión con pedidos sin enviar?' })
  await expect(notice).toContainText('Un pedido tuyo espera señal: Mesa 2')
  await evidence(page, 'pal-07-aviso-pendientes')
  await notice.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/acceso$/u)
  expect(await savedQueue(page)).toBe(1)
})
