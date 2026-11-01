// Regresión visual del control de mermas: la lista para contar, el reporte de
// diferencias con su tendencia, la bandeja de mermas por aprobar y cada
// ventana y confirmación que se abre desde ellas.
import type { Locator, Page } from '@playwright/test'

import type { Ingredient, StockCount } from '../../src/api/types'
import type { Local } from '../support/api'
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { api, id } from '../support/management'
import { capture, captureWindow, expect, deadline, test } from './capture'

const PACKAGING = { size: '750', label: 'botella', full_weight_g: '1250', empty_weight_g: '500' }

/** El pisco en botellas, con cuatro compradas. */
async function pisco(local: Local): Promise<Ingredient> {
  const created = await api(local).post<Ingredient>('/inventory/ingredients', { name: 'Pisco', unit: 'ml', min_stock: '0', unit_cost: '0.04', packaging: PACKAGING })
  await api(local).post('/inventory/purchases', { ingredient_id: id(created), entry_mode: 'packages', quantity: '4', unit_cost: '0.04', reason: 'Stock inicial' })
  return created
}

/** Abre una confirmación, la captura y la cancela. */
async function confirmation(page: Page, button: Locator, title: string | RegExp, name: string): Promise<void> {
  await button.click()
  const dialog = page.getByRole('alertdialog', { name: title })
  await captureWindow(dialog, name)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
}

test('VIS-23 el conteo en curso, sus confirmaciones, el reporte y la tendencia', async ({ page, local }) => {
  deadline(150_000)
  covers(
    'ruta:/inventario/conteos/:countId',
    'dialogo:inventory/stock-count/StartCountDialog',
    'confirmacion:inventory/stock-count/CountActions#1',
    'confirmacion:inventory/stock-count/CountActions#2',
    'hoja:inventory/stock-count/DifferenceTrendSheet',
  )
  const bottle = await pisco(local)
  await openAs(page, local.owner, '/inventario?vista=conteos')
  const panel = page.getByRole('tabpanel', { name: /^Conteos/u })
  await expect(panel.getByText('Todavía no hay conteos.')).toBeVisible()
  await capture(page, 'inventario-conteos')
  await panel.getByRole('button', { name: 'Iniciar conteo' }).click()
  const start = page.getByRole('dialog', { name: 'Iniciar conteo físico' })
  await start.getByText('Solo algunos').click()
  await captureWindow(start, 'dialogo-iniciar-conteo')
  await page.keyboard.press('Escape')

  const count = await api(local).post<StockCount>('/inventory/stock-counts', { scope: 'all', note: 'Cierre de mes' })
  const route = `/inventario/conteos/${String(id(count))}`
  await api(local).put(`/inventory/stock-counts/${String(id(count))}/lines`, {
    lines: [{ ingredient_id: id(bottle), mode: 'weight', quantity: '875', full_packages: '2' }],
  })
  await page.goto(route)
  await expect(page.getByText('1 de 4 insumos contados')).toBeVisible()
  await capture(page, 'conteo-en-curso')
  await confirmation(page, page.getByRole('button', { name: 'Cerrar conteo' }), /^¿Cerrar el conteo/u, 'confirmar-cerrar-conteo')
  await confirmation(page, page.getByRole('button', { name: 'Cancelar conteo' }), /^¿Cancelar el conteo/u, 'confirmar-cancelar-conteo')

  await api(local).post(`/inventory/stock-counts/${String(id(count))}/close`)
  await page.reload()
  await expect(page.getByRole('region', { name: 'Diferencias por insumo' }).getByText('Pisco')).toBeVisible()
  await capture(page, 'conteo-reporte')
  await page.getByRole('button', { name: 'Ver tendencia de Pisco' }).click()
  const trend = page.getByRole('dialog', { name: 'Tendencia: Pisco' })
  await expect(trend.getByRole('list', { name: 'Diferencias de Pisco por conteo' })).toBeVisible()
  await captureWindow(trend, 'hoja-tendencia-conteo')
})

test('VIS-24 la bandeja de mermas por aprobar, su confirmación y el rechazo', async ({ page, local }) => {
  deadline(90_000)
  covers(
    'ruta:/mermas-por-aprobar',
    'confirmacion:inventory/waste-approvals/WasteApprovalActions',
    'dialogo:inventory/waste-approvals/RejectWasteDialog',
  )
  const lomo = local.ingredients[0]
  await api(local).post('/inventory/waste', { ingredient_id: lomo?.id, quantity: '2000', reason: 'Se cortó la luz y se malogró' })

  await openAs(page, local.owner, '/mermas-por-aprobar')
  const card = page.getByRole('listitem').filter({ hasText: 'Lomo de res' })
  await expect(card).toBeVisible()
  await capture(page, 'mermas-por-aprobar')
  await confirmation(page, card.getByRole('button', { name: 'Aprobar' }), '¿Aprobar la merma de Lomo de res?', 'confirmar-aprobar-merma')
  await card.getByRole('button', { name: 'Rechazar' }).click()
  const reject = page.getByRole('dialog', { name: 'Rechazar la merma de Lomo de res' })
  await reject.getByLabel('Motivo del rechazo').fill('No coincide con la cámara')
  await captureWindow(reject, 'dialogo-rechazar-merma')
})
