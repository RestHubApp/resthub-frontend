// HU20, HU19, HU23: el panel de indicadores del encargado. Ventas, pedidos,
// ticket promedio y cancelados del período, platos, medios de pago, margen,
// meseros, insumos bajo el mínimo y mermas por causa; el rango de fechas acota
// cada sección. Las ventas se preparan por el API: pedidos servidos y cobrados.
import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'
import { api, diaDesdeHoy, fallaServidor, id, soles, vender } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-26 el encargado revisa los indicadores del período, mira las tablas, ordena el margen y clasifica las mermas', async ({ page, localConCaja: local }) => {
  cubre(
    'ruta:/panel',
    'funcion:panel.indicadores',
    'funcion:panel.secciones',
    'funcion:panel.ver-tabla',
    'funcion:panel.ordenar-margenes',
    'funcion:panel.bajo-minimo',
    'funcion:panel.clasificar-mermas',
  )
  await vender(local, { mesa: local.mesa('1'), items: [{ plato: local.plato('Lomo saltado'), cantidad: 2 }] })
  await vender(local, { mesa: local.mesa('2'), items: [{ plato: local.plato('Ceviche clásico') }, { plato: local.plato('Chicha morada') }], metodo: 'yape' })
  const cancelado = await api(local, local.mesero).post('/orders', {
    type: 'dine_in',
    table_id: local.mesa('3').id,
    items: [{ menu_item_id: local.plato('Ají de gallina').id, quantity: 1, notes: '' }],
  })
  await api(local).post(`/orders/${String(id(cancelado))}/cancel`, { reason: 'El cliente se fue' })
  await api(local).post('/inventory/waste', { ingredient_id: local.insumos[1].id, quantity: '100', reason: 'Se venció en la cámara' })

  await abrirComo(page, local.encargado, '/panel')
  await expect(page.getByRole('heading', { level: 1, name: 'Panel BI' })).toBeVisible()
  const rango = page.getByRole('group', { name: 'Rango de fechas' })
  await expect(rango.getByRole('button', { name: '30 días' })).toHaveAttribute('aria-pressed', 'true')
  const kpis = page.getByRole('region', { name: 'Indicadores del período' })
  const kpi = (nombre: string) => kpis.getByText(nombre, { exact: true }).locator('xpath=..')
  await expect(kpi('Ventas')).toContainText(soles('100.00'))
  await expect(kpi('Pedidos pagados')).toContainText('2')
  await expect(kpi('Ticket promedio')).toContainText(soles('50.00'))
  await expect(kpi('Cancelados')).toContainText('1')
  await expect(kpi('Cancelados')).toContainText(/S\/\s*24\.00 sin cobrar/u)
  await expect(kpi('Ventas')).toContainText('Sin datos del período anterior')
  await evidencia(page, 'ges-26-1-indicadores')

  // Cada gráfico tiene su tabla.
  const seccion = (titulo: string) => page.getByRole('heading', { name: titulo, exact: true }).locator('xpath=../../..')
  const platos = seccion('Platos más vendidos')
  await platos.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(platos.getByRole('row', { name: /Lomo saltado/u })).toContainText(soles('64.00'))
  await expect(platos.getByRole('button', { name: 'Ver gráfico' })).toHaveAttribute('aria-pressed', 'true')
  await platos.getByRole('button', { name: 'Ver gráfico' }).click()
  await expect(platos.getByRole('table')).toHaveCount(0)
  const pagos = seccion('Ingresos por medio de pago')
  await expect(pagos).toContainText(/Total cobrado: S\/\s*100\.00\./u)
  await pagos.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(pagos.getByRole('row', { name: /Efectivo/u })).toContainText(soles('64.00'))
  await expect(pagos.getByRole('row', { name: /Yape/u })).toContainText(soles('36.00'))
  const dias = seccion('Ventas por día')
  await dias.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(dias.getByRole('row').filter({ hasText: /S\/\s*100\.00/u })).toHaveCount(1)
  await expect(seccion('Pedidos por día y hora')).toContainText('Hora pico:')
  await expect(seccion('Rendimiento por mesero').getByRole('row', { name: /Mesero Prueba/u })).toContainText(soles('100.00'))
  await evidencia(page, 'ges-26-2-tablas')

  // El margen por plato se ordena tocando la cabecera.
  const margen = seccion('Margen por plato')
  await expect(margen.getByRole('row').nth(1)).toContainText('Lomo saltado')
  await margen.getByRole('button', { name: /^Plato/u }).click()
  await expect(margen.getByRole('columnheader', { name: /Plato/u })).toHaveAttribute('aria-sort', 'ascending')
  await expect(margen.getByRole('row').nth(1)).toContainText('Ají de gallina')

  // Lo que está bajo el mínimo lleva a la reposición.
  const bajos = seccion('Insumos bajo mínimo')
  await expect(bajos.getByRole('meter', { name: 'Stock de Culantro respecto del mínimo' })).toBeVisible()
  await expect(bajos.getByRole('link', { name: 'Ver reposición sugerida' })).toHaveAttribute('href', '/panel/reposicion')

  // La merma escrita se clasifica (por reglas: no hay clave de IA).
  const mermas = seccion('Mermas')
  await expect(mermas).toContainText(/1 mermas por S\/\s*0\.30/u)
  await mermas.getByRole('button', { name: 'Clasificar mermas pendientes (1)' }).click()
  await expect(mermas.getByText('Se clasificaron 1 mermas.')).toBeVisible()
  await mermas.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(mermas.getByRole('table', { name: 'Mermas por causa' })).toContainText('Vencimiento')
  await evidencia(page, 'ges-26-3-mermas')

})

test('GES-28 el encargado acota el panel con los rangos de siempre y uno personalizado, y un rango sin ventas lo dice', async ({ page, localConCaja: local }) => {
  cubre('funcion:panel.rango-predefinido', 'funcion:panel.rango-personalizado', 'funcion:panel.rango-invalido', 'estado:panel.sin-ventas')
  await vender(local, { mesa: local.mesa('1'), items: [{ plato: local.plato('Lomo saltado') }] })
  await abrirComo(page, local.encargado, '/panel')
  const rango = page.getByRole('group', { name: 'Rango de fechas' })
  const kpi = (nombre: string) => page.getByRole('region', { name: 'Indicadores del período' }).getByText(nombre, { exact: true }).locator('xpath=..')
  await expect(kpi('Ventas')).toContainText(soles('32.00'))
  // Los rangos de siempre y uno personalizado.
  await rango.getByRole('button', { name: 'Hoy' }).click()
  await expect(page).toHaveURL(/rango=hoy/u)
  await expect(kpi('Ventas')).toContainText(soles('32.00'))
  await rango.getByRole('button', { name: '7 días' }).click()
  await expect(page).toHaveURL(/rango=7d/u)
  await rango.getByRole('button', { name: 'Este mes' }).click()
  await expect(page).toHaveURL(/rango=mes/u)
  await rango.getByRole('button', { name: 'Personalizado' }).click()
  await page.getByLabel('Desde').fill(diaDesdeHoy(-1))
  await page.getByLabel('Hasta').fill(diaDesdeHoy(-2))
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('La fecha de inicio tiene que ser anterior a la de fin.')).toBeVisible()
  await page.getByLabel('Desde').fill(diaDesdeHoy(-2))
  await page.getByLabel('Hasta').fill(diaDesdeHoy(-1))
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page).toHaveURL(new RegExp(`rango=personalizado&desde=${diaDesdeHoy(-2)}&hasta=${diaDesdeHoy(-1)}`, 'u'))
  await expect(page.getByText(/\(2 días\)\./u)).toBeVisible()
  await expect(kpi('Ventas')).toContainText(soles('0.00'))
  await expect(page.getByText('No hubo pedidos pagados en este rango.')).toBeVisible()
  await expect(page.getByText('No se vendieron platos en este rango.')).toBeVisible()
  await expect(page.getByText('No hubo cobros en este rango.')).toBeVisible()
  await expect(page.getByText('Nadie cobró pedidos en este rango.')).toBeVisible()
  await expect(page.getByText('No se registraron mermas en este rango.')).toBeVisible()
  await evidencia(page, 'ges-28-1-sin-ventas')
})

test('GES-27 cada sección del panel avisa si el servidor falla', async ({ page, local }) => {
  cubre('estado:panel.error')
  await fallaServidor(page, '/insights')
  await abrirComo(page, local.encargado, '/panel')
  for (const mensaje of [
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
    await expect(page.getByText(mensaje)).toBeVisible()
  }
  await evidencia(page, 'ges-27-1-error')
})
