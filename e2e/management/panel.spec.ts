// HU20, HU19, HU23: el panel de indicadores del encargado. Ventas, pedidos,
// ticket promedio y cancelados del período, platos, medios de pago, margen,
// meseros, insumos bajo el mínimo y mermas por causa; el rango de fechas acota
// cada sección. Las ventas se preparan por el API: pedidos servidos y cobrados.
import type { OrderResponse } from '../../src/api/types'
import { defined } from '../support/defined'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'
import { api, dayFromToday, failureServer, id, soles, sell } from '../support/management'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-26 el encargado revisa los indicadores del período, mira las tablas, ordena el margen y clasifica las mermas', async ({ page, restaurantWithCashRegister: local }) => {
  covers(
    'ruta:/panel',
    'funcion:panel.indicadores',
    'funcion:panel.secciones',
    'funcion:panel.ver-tabla',
    'funcion:panel.ordenar-margenes',
    'funcion:panel.bajo-minimo',
    'funcion:panel.clasificar-mermas',
  )
  await sell(local, { table: local.table('1'), items: [{ dish: local.dish('Lomo saltado'), quantity: 2 }] })
  await sell(local, { table: local.table('2'), items: [{ dish: local.dish('Ceviche clásico') }, { dish: local.dish('Chicha morada') }], method: 'yape' })
  const cancelled = await api(local, local.waiter).post<OrderResponse>('/orders', {
    type: 'dine_in',
    table_id: local.table('3').id,
    items: [{ menu_item_id: local.dish('Ají de gallina').id, quantity: 1, notes: '' }],
  })
  await api(local).post(`/orders/${String(id(cancelled))}/cancel`, { reason: 'El cliente se fue' })
  await api(local).post('/inventory/waste', { ingredient_id: defined(local.ingredients[1]).id, quantity: '100', reason: 'Se venció en la cámara' })

  await openAs(page, local.owner, '/panel')
  await expect(page.getByRole('heading', { level: 1, name: 'Resumen del negocio' })).toBeVisible()
  const range = page.getByRole('group', { name: 'Rango de fechas' })
  await expect(range.getByRole('button', { name: '30 días' })).toHaveAttribute('aria-pressed', 'true')
  const kpis = page.getByRole('region', { name: 'Indicadores del período' })
  const kpi = (name: string) => kpis.getByText(name, { exact: true }).locator('xpath=..')
  await expect(kpi('Ventas')).toContainText(soles('100.00'))
  await expect(kpi('Pedidos pagados')).toContainText('2')
  await expect(kpi('Ticket promedio')).toContainText(soles('50.00'))
  await expect(kpi('Cancelados')).toContainText('1')
  await expect(kpi('Cancelados')).toContainText(/S\/\s*24\.00 sin cobrar/u)
  await expect(kpi('Ventas')).toContainText('Sin datos del período anterior')
  await evidence(page, 'ges-26-1-indicadores')

  // Cada gráfico tiene su tabla.
  const section = (title: string) => page.getByRole('heading', { name: title, exact: true }).locator('xpath=../../..')
  const dishes = section('Platos más vendidos')
  await dishes.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(dishes.getByRole('row', { name: /Lomo saltado/u })).toContainText(soles('64.00'))
  await expect(dishes.getByRole('button', { name: 'Ver gráfico' })).toHaveAttribute('aria-pressed', 'true')
  await dishes.getByRole('button', { name: 'Ver gráfico' }).click()
  await expect(dishes.getByRole('table')).toHaveCount(0)
  const payments = section('Ingresos por medio de pago')
  await expect(payments).toContainText(/Total cobrado: S\/\s*100\.00\./u)
  await payments.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(payments.getByRole('row', { name: /Efectivo/u })).toContainText(soles('64.00'))
  await expect(payments.getByRole('row', { name: /Yape/u })).toContainText(soles('36.00'))
  const days = section('Ventas por día')
  await days.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(days.getByRole('row').filter({ hasText: /S\/\s*100\.00/u })).toHaveCount(1)
  await expect(section('Pedidos por día y hora')).toContainText('Hora pico:')
  await expect(section('Rendimiento por mesero').getByRole('row', { name: /Mesero Prueba/u })).toContainText(soles('100.00'))
  await evidence(page, 'ges-26-2-tablas')

  // El margen por plato se ordena tocando la cabecera.
  const margin = section('Margen por plato')
  await expect(margin.getByRole('row').nth(1)).toContainText('Lomo saltado')
  await margin.getByRole('button', { name: /^Plato/u }).click()
  await expect(margin.getByRole('columnheader', { name: /Plato/u })).toHaveAttribute('aria-sort', 'ascending')
  await expect(margin.getByRole('row').nth(1)).toContainText('Ají de gallina')

  // Lo que está bajo el mínimo lleva a la reposición.
  const low = section('Insumos bajo mínimo')
  await expect(low).toContainText('Culantro')
  await expect(low.getByRole('link', { name: 'Ver reposición sugerida' })).toHaveAttribute('href', '/panel/reposicion')

  // La merma escrita se clasifica (por reglas: no hay clave de IA).
  const wastes = section('Mermas')
  await expect(wastes).toContainText(/1 mermas por S\/\s*0\.30/u)
  await wastes.getByRole('button', { name: 'Clasificar mermas pendientes (1)' }).click()
  await expect(wastes.getByText('Se clasificaron 1 mermas.')).toBeVisible()
  await wastes.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(wastes.getByRole('table', { name: 'Mermas por causa' })).toContainText('Vencimiento')
  await evidence(page, 'ges-26-3-mermas')

})

test('GES-28 el encargado acota el panel con los rangos de siempre y uno personalizado, y un rango sin ventas lo dice', async ({ page, restaurantWithCashRegister: local }) => {
  covers('funcion:panel.rango-predefinido', 'funcion:panel.rango-personalizado', 'funcion:panel.rango-invalido', 'estado:panel.sin-ventas')
  await sell(local, { table: local.table('1'), items: [{ dish: local.dish('Lomo saltado') }] })
  await openAs(page, local.owner, '/panel')
  const range = page.getByRole('group', { name: 'Rango de fechas' })
  const kpi = (name: string) => page.getByRole('region', { name: 'Indicadores del período' }).getByText(name, { exact: true }).locator('xpath=..')
  await expect(kpi('Ventas')).toContainText(soles('32.00'))
  // Los rangos de siempre y uno personalizado.
  await range.getByRole('button', { name: 'Hoy' }).click()
  await expect(page).toHaveURL(/rango=hoy/u)
  await expect(kpi('Ventas')).toContainText(soles('32.00'))
  await range.getByRole('button', { name: '7 días' }).click()
  await expect(page).toHaveURL(/rango=7d/u)
  await range.getByRole('button', { name: 'Este mes' }).click()
  await expect(page).toHaveURL(/rango=mes/u)
  await range.getByRole('button', { name: 'Personalizado' }).click()
  await page.getByLabel('Desde').fill(dayFromToday(-1))
  await page.getByLabel('Hasta').fill(dayFromToday(-2))
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('La fecha de inicio tiene que ser anterior a la de fin.')).toBeVisible()
  await page.getByLabel('Desde').fill(dayFromToday(-2))
  await page.getByLabel('Hasta').fill(dayFromToday(-1))
  await page.getByRole('button', { name: 'Aplicar' }).click()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(page).toHaveURL(new RegExp(`rango=personalizado&desde=${dayFromToday(-2)}&hasta=${dayFromToday(-1)}`, 'u'))
  await expect(page.getByText(/\(2 días\)\./u)).toBeVisible()
  await expect(kpi('Ventas')).toContainText(soles('0.00'))
  await expect(page.getByText('No hubo pedidos pagados en este rango.')).toBeVisible()
  await expect(page.getByText('No se vendieron platos en este rango.')).toBeVisible()
  await expect(page.getByText('No hubo cobros en este rango.')).toBeVisible()
  await expect(page.getByText('Nadie cobró pedidos en este rango.')).toBeVisible()
  await expect(page.getByText('No se registraron mermas en este rango.')).toBeVisible()
  await evidence(page, 'ges-28-1-sin-ventas')
})

test('GES-27 cada sección del panel avisa si el servidor falla', async ({ page, local }) => {
  covers('estado:panel.error')
  await failureServer(page, '/insights')
  await openAs(page, local.owner, '/panel')
  for (const message of [
    'No se pudo cargar el resumen del período.',
    'No se pudieron cargar las ventas por día.',
    'No se pudo cargar el mapa por hora.',
    'No se pudieron cargar los platos más vendidos.',
    'No se pudieron cargar los medios de pago.',
    'No se pudo cargar el margen por plato.',
    'No se pudo cargar el rendimiento por mesero.',
    'No se pudo cargar el stock.',
    'No se pudieron cargar las mermas.',
  ]) {
    await expect(page.getByText(message)).toBeVisible()
  }
  await evidence(page, 'ges-27-1-error')
})
