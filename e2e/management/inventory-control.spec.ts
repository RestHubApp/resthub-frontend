// Control de mermas: el envase de un insumo y la compra en envases, el conteo
// físico con su reporte de diferencias, y las mermas grandes que esperan la
// aprobación del encargado.
import type { Ingredient, StockCount, WasteApproval } from '../../src/api/types'
import type { Local } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, id } from '../support/management'

const PACKAGING = { size: '750', label: 'botella', full_weight_g: '1250', empty_weight_g: '500' }

test.beforeEach(() => {
  test.slow()
})

/** El pisco en botellas de 750 ml con sus pesos, y cuatro botellas compradas a S/ 30. */
async function pisco(local: Local): Promise<Ingredient> {
  const created = await api(local).post<Ingredient>('/inventory/ingredients', {
    name: 'Pisco',
    unit: 'ml',
    min_stock: '0',
    unit_cost: '0.04',
    packaging: PACKAGING,
  })
  await api(local).post('/inventory/purchases', { ingredient_id: id(created), entry_mode: 'packages', quantity: '4', unit_cost: '0.04', reason: 'Stock inicial' })
  return created
}

async function stockOf(local: Local, name: string): Promise<string | undefined> {
  const ingredients = await api(local).get<Ingredient[]>('/inventory/ingredients')
  return ingredients.find((ingredient) => ingredient.name === name)?.stock
}

test('GES-50 el encargado da de alta el pisco con su botella y compra en botellas', async ({ page, local }) => {
  covers('funcion:inventario.envase', 'funcion:inventario.compra-en-envases')
  await openAs(page, local.owner, '/inventario')
  await page.getByRole('button', { name: 'Nuevo insumo' }).click()
  const form = page.getByRole('dialog', { name: 'Nuevo insumo' })
  await form.getByLabel('Nombre', { exact: true }).fill('Pisco')
  await form.getByLabel('Cómo se mide').selectOption('ml')
  await form.getByLabel('Cuánto trae', { exact: true }).fill('750')
  await form.getByLabel('Tipo de envase').fill('botella')
  await form.getByLabel('Peso lleno (g)').fill('1250')
  await form.getByRole('button', { name: 'Crear insumo' }).click()
  await expect(form.getByText('Para contar por peso escribe los dos pesos, o deja los dos vacíos')).toBeVisible()
  await form.getByLabel('Peso vacío (g)').fill('500')
  await evidence(page, 'ges-50-1-envase')
  await form.getByRole('button', { name: 'Crear insumo' }).click()
  await expect(notice(page, 'Insumo Pisco creado.')).toBeVisible()

  await page.getByRole('button', { name: 'Compra de Pisco' }).click()
  const purchase = page.getByRole('dialog', { name: 'Registrar compra: Pisco' })
  await purchase.getByLabel('Cantidad comprada', { exact: true }).fill('4')
  await purchase.getByLabel('Unidad de cantidad comprada').selectOption({ label: 'botella' })
  await expect(purchase.getByText(/4 × botella de 750\sml = 3\sL/u)).toBeVisible()
  await purchase.getByLabel('Costo por L (S/)').fill('40')
  await evidence(page, 'ges-50-2-compra-en-botellas')
  await purchase.getByRole('button', { name: 'Registrar compra' }).click()
  await expect(notice(page, /Compra registrada: Pisco queda en 3\sL/u)).toBeVisible()
  expect(await stockOf(local, 'Pisco')).toBe('3000.000')
})

test('GES-51 un conteo por peso y en kg, cerrado con lo pendiente avisado, deja el reporte y la tendencia', async ({ page, local }) => {
  covers(
    'ruta:/inventario/conteos/:countId',
    'dialogo:inventory/stock-count/StartCountDialog',
    'confirmacion:inventory/stock-count/CountActions#1',
    'hoja:inventory/stock-count/DifferenceTrendSheet',
    'funcion:conteo.iniciar',
    'funcion:conteo.contar',
    'funcion:conteo.buscar',
    'funcion:conteo.cerrar',
    'funcion:conteo.reporte',
    'funcion:conteo.tendencia',
    'funcion:conteo.historial',
  )
  await pisco(local)
  await openAs(page, local.owner, '/inventario?vista=conteos')
  await page.getByRole('tabpanel', { name: /^Conteos/u }).getByRole('button', { name: 'Iniciar conteo' }).click()
  const start = page.getByRole('dialog', { name: 'Iniciar conteo físico' })
  await expect(start.getByText('Todos los insumos (4)')).toBeVisible()
  await start.getByRole('button', { name: 'Iniciar conteo' }).click()
  await expect(page).toHaveURL(/\/inventario\/conteos\/\d+$/u)
  await expect(page.getByText('0 de 4 insumos contados')).toBeVisible()

  await page.getByRole('searchbox', { name: 'Buscar insumo' }).fill('pisco')
  const bottle = page.getByRole('form', { name: 'Conteo de Pisco' })
  await bottle.getByText('Por peso').click()
  await bottle.getByLabel('Peso del abierto (g)').fill('875')
  await bottle.getByLabel('Cerrados, además').fill('2')
  await expect(bottle.getByText(/= 1\.875\sL/u)).toBeVisible()
  await evidence(page, 'ges-51-1-por-peso')
  await bottle.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText(/Contado: 1\.875\sL/u)).toBeVisible()

  await page.getByRole('searchbox', { name: 'Buscar insumo' }).fill('')
  const lomo = page.getByRole('form', { name: 'Conteo de Lomo de res' })
  await lomo.getByLabel('Cantidad (kg)').fill('4.8')
  await lomo.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('2 de 4 insumos contados')).toBeVisible()
  await page.getByText('Pendientes', { exact: true }).click()
  await expect(page.getByRole('form', { name: /^Conteo de/u })).toHaveCount(2)

  await page.getByRole('button', { name: 'Cerrar conteo' }).click()
  const confirm = page.getByRole('alertdialog', { name: /^¿Cerrar el conteo #\d+\?$/u })
  await expect(confirm).toContainText('Quedan 2 insumos sin contar: no se ajustan y su stock sigue igual.')
  await confirm.getByRole('button', { name: 'Cerrar y ajustar' }).click()
  await expect(notice(page, /El stock quedó ajustado a lo contado/u)).toBeVisible()

  const report = page.getByRole('region', { name: 'Diferencias por insumo' })
  const rows = report.getByRole('row')
  await expect(rows.nth(1)).toContainText('Pisco')
  await expect(rows.nth(1)).toContainText('Diferencia grande')
  await expect(rows.nth(2)).toContainText('Lomo de res')
  await expect(rows.nth(2)).not.toContainText('Diferencia grande')
  await expect(page.getByText('Neto').locator('..')).toContainText(/−S\/\s53\.40/u)
  await evidence(page, 'ges-51-2-reporte')
  expect(await stockOf(local, 'Pisco')).toBe('1875.000')
  expect(await stockOf(local, 'Cebolla roja')).toBe('3000.000')

  await page.getByRole('button', { name: 'Tendencia de Pisco' }).click()
  const trend = page.getByRole('dialog', { name: 'Tendencia: Pisco' })
  await expect(trend.getByRole('list', { name: 'Diferencias de Pisco por conteo' }).getByRole('listitem')).toHaveCount(1)
  await page.keyboard.press('Escape')

  await page.getByRole('link', { name: 'Volver a conteos' }).click()
  await expect(page.getByRole('tabpanel', { name: /^Conteos/u }).getByRole('listitem').first()).toContainText('Cerrado')
})

test('GES-52 un conteo en curso se cancela sin tocar el stock', async ({ page, local }) => {
  covers('confirmacion:inventory/stock-count/CountActions#2', 'funcion:conteo.cancelar')
  const count = await api(local).post<StockCount>('/inventory/stock-counts', { scope: 'all', note: '' })
  await api(local).put(`/inventory/stock-counts/${String(id(count))}/lines`, { lines: [{ ingredient_id: count.lines[0]?.ingredient_id, mode: 'base', quantity: '1', full_packages: '0' }] })

  await openAs(page, local.owner, `/inventario/conteos/${String(id(count))}`)
  await page.getByRole('button', { name: 'Cancelar conteo' }).click()
  const confirm = page.getByRole('alertdialog', { name: `¿Cancelar el conteo #${String(count.number)}?` })
  await confirm.getByRole('button', { name: 'Cancelar conteo' }).click()
  await expect(notice(page, `Conteo #${String(count.number)} cancelado. El stock no cambió.`)).toBeVisible()
  await expect(page.getByText('Este conteo se canceló.')).toBeVisible()
  expect(await stockOf(local, 'Lomo de res')).toBe('5000.000')
})

test('GES-53 una merma grande queda por aprobar; el encargado aprueba una, rechaza otra y apaga el monto', async ({ page, local }) => {
  covers(
    'ruta:/mermas-por-aprobar',
    'confirmacion:inventory/waste-approvals/WasteApprovalActions',
    'dialogo:inventory/waste-approvals/RejectWasteDialog',
    'funcion:inventario.merma-por-aprobar',
    'funcion:inventario.monto-aprobacion',
    'funcion:mermas.aprobar',
    'funcion:mermas.rechazar',
    'funcion:mermas.insignia',
  )
  await openAs(page, local.owner, '/inventario')
  await page.getByRole('button', { name: 'Más acciones de Lomo de res' }).click()
  await page.getByRole('menu', { name: 'Más acciones de Lomo de res' }).getByRole('menuitem', { name: 'Merma' }).click()
  const waste = page.getByRole('dialog', { name: 'Registrar merma: Lomo de res' })
  await waste.getByLabel('Cantidad perdida', { exact: true }).fill('2000')
  await expect(waste.getByText(/quedará por aprobar/u)).toBeVisible()
  await waste.getByLabel('Motivo').fill('Se cortó la luz y se malogró')
  await waste.getByRole('button', { name: 'Registrar merma' }).click()
  await expect(notice(page, /supera el monto del local: queda por aprobar/u)).toBeVisible()
  expect(await stockOf(local, 'Lomo de res')).toBe('5000.000')

  const entry = page.getByRole('link', { name: /^Mermas por aprobar/u })
  await expect(entry).toContainText('1 por aprobar')
  await entry.click()
  await evidence(page, 'ges-53-1-bandeja')
  const card = page.getByRole('listitem').filter({ hasText: 'Lomo de res' })
  await card.getByRole('button', { name: 'Aprobar' }).click()
  await page.getByRole('alertdialog', { name: '¿Aprobar la merma de Lomo de res?' }).getByRole('button', { name: 'Aprobar merma' }).click()
  await expect(notice(page, 'Merma de Lomo de res aprobada: el stock bajó.')).toBeVisible()
  expect(await stockOf(local, 'Lomo de res')).toBe('3000.000')

  // 1.5 kg de lomo a S/ 42 el kilo son S/ 63: también pasa el monto.
  const pending = await api(local).post<WasteApproval>('/inventory/waste', { ingredient_id: local.ingredients[0]?.id, quantity: '1500', reason: 'Se quemó en la parrilla' })
  expect(pending.status).toBe('pending_approval')
  await page.reload()
  await page.getByRole('listitem').filter({ hasText: 'Se quemó en la parrilla' }).getByRole('button', { name: 'Rechazar' }).click()
  const reject = page.getByRole('dialog', { name: 'Rechazar la merma de Lomo de res' })
  await reject.getByLabel('Motivo del rechazo').fill('El lomo está en la cámara')
  await reject.getByRole('button', { name: 'Rechazar merma' }).click()
  await expect(notice(page, 'Merma de Lomo de res rechazada. El stock no cambió.')).toBeVisible()
  expect(await stockOf(local, 'Lomo de res')).toBe('3000.000')
  await expect(page.getByText('No hay mermas esperando aprobación.')).toBeVisible()
  await expect(entry).toHaveText('Mermas por aprobar')

  await page.goto('/inventario')
  await page.getByRole('button', { name: 'Reglas de stock' }).click()
  const amount = page.getByLabel('Pedir aprobación de mermas desde (S/)')
  await expect(amount).toHaveValue('50.00')
  await amount.fill('')
  await page.getByRole('button', { name: 'Guardar monto' }).click()
  await expect(notice(page, 'Las mermas ya no piden aprobación.')).toBeVisible()
})

test('GES-54 quien solo lee el inventario ve los conteos sin iniciarlos y no tiene la bandeja de mermas', async ({ page, local }) => {
  covers('funcion:conteo.sin-permiso', 'funcion:mermas.sin-permiso')
  await openAs(page, local.kitchen, '/inventario?vista=conteos')
  const panel = page.getByRole('tabpanel', { name: /^Conteos/u })
  await expect(panel.getByText('No hay ningún conteo en curso.')).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Iniciar conteo' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /^Mermas por aprobar/u })).toHaveCount(0)
})
