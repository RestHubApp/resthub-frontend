// Regresión visual de la paleta «Buscar o ir a…» (encargado y mesero), de
// «Apariencia rápida» y del aviso al salir desde la paleta con un pedido que
// espera señal.
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { capture, captureWindow, expect, deadline, test } from './capture'
import { ownerOf, orderInQueue } from './prepare'

const PALETTE = { name: 'Buscar o ir a…' }

test('VIS-17 la paleta de comandos del encargado, su búsqueda y «Apariencia rápida»', async ({ page, local }) => {
  deadline(90_000)
  covers('dialogo:shell/quick/QuickPalette', 'hoja:shell/quick/QuickAppearanceButton')

  await openAs(page, local.owner, '/pedidos')
  await expect(page.getByRole('heading', { level: 1, name: 'Pedidos' })).toBeVisible()
  await capture(page, 'paleta-pantalla-con-boton')

  await page.getByRole('button', PALETTE).click()
  const palette = page.getByRole('dialog', PALETTE)
  await expect(palette.getByRole('combobox')).toBeFocused()
  await captureWindow(palette, 'paleta-abierta')

  await palette.getByRole('combobox').fill('caja')
  await expect(palette.getByRole('option', { name: /^Caja/u })).toBeVisible()
  await captureWindow(palette, 'paleta-busqueda')

  await palette.getByRole('combobox').fill('zzzz')
  await expect(palette.getByText('Nada coincide con «zzzz».')).toBeVisible()
  await captureWindow(palette, 'paleta-sin-resultados')
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()

  await page.getByRole('button', { name: 'Apariencia rápida' }).first().click()
  const quick = page.getByRole('dialog', { name: 'Apariencia rápida' })
  await expect(quick.getByRole('radio', { name: 'Claro' })).toBeChecked()
  await captureWindow(quick, 'apariencia-rapida')
})

test('VIS-18 la paleta de comandos del mesero y el aviso al salir con un pedido sin enviar', async ({ page, local }) => {
  deadline(90_000)
  covers('dialogo:shell/quick/QuickPalette', 'confirmacion:shell/quick/QuickPaletteHost')

  await openAs(page, local.waiter, '/perfil')
  await orderInQueue(page, { owner: ownerOf(local.waiter), table: local.table('3'), dish: local.dish('Lomo saltado') })
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()

  await page.getByRole('button', PALETTE).click()
  const palette = page.getByRole('dialog', PALETTE)
  await expect(palette.getByRole('option', { name: /^Cerrar sesión/u })).toBeVisible()
  await captureWindow(palette, 'paleta-mesero')

  await palette.getByRole('option', { name: /^Cerrar sesión/u }).click()
  const notice = page.getByRole('alertdialog', { name: '¿Cerrar sesión con pedidos sin enviar?' })
  await expect(notice).toContainText('Mesa 3')
  await captureWindow(notice, 'paleta-confirmar-cerrar-sesion')
  await notice.getByRole('button', { name: 'Cancelar' }).click()
  await expect(notice).toBeHidden()
})
