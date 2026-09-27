// HU27: el encargado abre la caja con el efectivo inicial, ve el arqueo en
// curso, la cierra contando el cajón y revisa los turnos anteriores.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, fallaServidor, soles, vender } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-01 el encargado abre la caja, ve el efectivo esperado, la cierra con el arqueo y revisa el turno en el historial', async ({ page, local }) => {
  cubre(
    'ruta:/caja',
    'dialogo:cash/CashSessionDialog',
    'funcion:caja.abrir',
    'funcion:caja.arqueo-en-curso',
    'funcion:caja.diferencia-en-vivo',
    'funcion:caja.cerrar',
    'funcion:caja.historial',
    'funcion:caja.ver-turno',
    'funcion:caja.sin-caja-no-se-cobra',
    'estado:caja.historial-vacio',
  )
  await abrirComo(page, local.encargado, '/caja')
  await expect(page.getByRole('heading', { level: 1, name: 'Caja' })).toBeVisible()
  await expect(page.getByText('Todavía no hay turnos de caja')).toBeVisible()

  await page.getByLabel('Efectivo inicial').fill('150')
  await page.getByLabel('Nota (opcional)').fill('Turno de la mañana')
  await page.getByRole('button', { name: 'Abrir caja' }).click()
  await expect(aviso(page, /Caja abierta con S\/\s*150\.00\. Ya se puede cobrar\./u)).toBeVisible()
  const enCurso = page.getByRole('heading', { name: 'Turno en curso' }).locator('xpath=../../..')
  await expect(enCurso).toContainText(soles('150.00'))
  await expect(enCurso.getByText('Todavía no hay cobros en este turno.')).toBeVisible()
  await evidencia(page, 'ges-01-1-caja-abierta')

  // Dos cobros del salón: uno en efectivo con propina y otro con Yape.
  await vender(local, { mesa: local.mesa('1'), items: [{ plato: local.plato('Lomo saltado') }], propina: '3.00' })
  await vender(local, { mesa: local.mesa('2'), items: [{ plato: local.plato('Ají de gallina') }], metodo: 'yape' })
  const actual = (await api(local).get('/cash/current')).session as { summary: { expected_cash: string } }
  expect(actual.summary.expected_cash).toBe('185.00')

  // El arqueo se actualiza solo con los cobros (canal de pedidos).
  const tile = (nombre: string) => enCurso.getByRole('term').filter({ hasText: nombre }).locator('xpath=..')
  await expect(tile('Ventas del turno')).toContainText(soles('56.00'))
  await expect(tile('Pedidos cobrados')).toContainText('2')
  await expect(tile('Propinas')).toContainText(soles('3.00'))
  await expect(tile('Efectivo esperado')).toContainText(soles('185.00'))
  const medios = page.getByRole('table', { name: 'Por medio de pago' })
  await expect(medios.getByRole('row', { name: /Efectivo/u })).toContainText(soles('32.00'))
  await expect(medios.getByRole('row', { name: /Yape/u })).toContainText(soles('24.00'))
  const propinas = page.getByRole('table', { name: /Propinas por mesero/u })
  await expect(propinas.getByRole('row', { name: /Mesero Prueba/u })).toContainText(soles('3.00'))
  await evidencia(page, 'ges-01-2-arqueo-en-curso')

  // La diferencia se ve mientras se cuenta.
  const contado = page.getByLabel('Efectivo contado')
  await expect(page.getByText(/Esperado: S\/\s*185\.00/u)).toBeVisible()
  const diferencia = page.getByText('Diferencia', { exact: true }).locator('xpath=..')
  await expect(diferencia).toContainText('—')
  await contado.fill('190')
  await expect(diferencia).toContainText(/Sobran S\/\s*5\.00/u)
  await contado.fill('185')
  await expect(diferencia).toContainText('Cuadra')
  await contado.fill('183.50')
  await expect(diferencia).toContainText(/Faltan S\/\s*1\.50/u)
  await page.getByLabel('Nota (opcional)').fill('Faltó sencillo')
  await evidencia(page, 'ges-01-3-diferencia')
  await page.getByRole('button', { name: 'Cerrar caja' }).click()
  await expect(aviso(page, /Caja cerrada\. Faltan S\/\s*1\.50\./u)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Abrir caja' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Turno en curso' })).toBeHidden()

  // Sin caja abierta, el servidor no deja cobrar.
  await expect(vender(local, { mesa: local.mesa('3'), items: [{ plato: local.plato('Chicha morada') }] })).rejects.toThrow(
    /La caja está cerrada/u,
  )

  // El turno queda en el historial con su diferencia, y se abre su arqueo firmado.
  const turno = page.getByRole('button', { name: /Cerró Encargada Prueba · abrió Encargada Prueba/u })
  await expect(turno).toContainText(soles('185.00'))
  await expect(turno).toContainText(/Diferencia -S\/\s*1\.50/u)
  await turno.click()
  const dialogo = page.getByRole('dialog', { name: /Turno de caja \d+/u })
  await expect(dialogo).toBeVisible()
  await expect(dialogo).toContainText(/Contado S\/\s*183\.50 · diferencia -S\/\s*1\.50/u)
  await expect(dialogo).toContainText('Nota: Faltó sencillo')
  await expect(dialogo.getByRole('table', { name: 'Por medio de pago' })).toContainText('Yape')
  await evidencia(page, 'ges-01-4-turno-cerrado')
  await page.keyboard.press('Escape')
  await expect(dialogo).toBeHidden()

  const sesiones = await api(local).lista('/cash/sessions')
  expect(sesiones[0]).toMatchObject({ is_open: false, counted_cash: '183.50', expected_cash: '185.00', difference: '-1.50' })
})

test('GES-02 el encargado valida el monto inicial, cambia el tope de descuento del mesero y ve el aviso de pedidos sin cobrar', async ({ page, local }) => {
  cubre(
    'desplegable:components/CollapsibleHeading',
    'funcion:caja.validar-monto',
    'funcion:caja.tope-descuento',
    'funcion:caja.aviso-pedidos-sin-cobrar',
  )
  await abrirComo(page, local.encargado, '/caja')
  await page.getByRole('button', { name: 'Abrir caja' }).click()
  await expect(page.getByText('Escribe el monto')).toBeVisible()
  await page.getByLabel('Efectivo inicial').fill('cien')
  await page.getByRole('button', { name: 'Abrir caja' }).click()
  await expect(page.getByText('Escribe un monto como 150 o 150.50')).toBeVisible()
  await expect(page.getByLabel('Efectivo inicial')).toHaveAttribute('aria-invalid', 'true')
  await evidencia(page, 'ges-02-1-monto-invalido')

  // El tope del mesero vive plegado: se abre, se cambia y se vuelve a plegar.
  const plegable = page.getByRole('button', { name: 'Descuentos del mesero' })
  await expect(plegable).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByLabel('Descuento máximo del mesero (%)')).toBeHidden()
  await plegable.click()
  await expect(plegable).toHaveAttribute('aria-expanded', 'true')
  const tope = page.getByLabel('Descuento máximo del mesero (%)')
  await expect(tope).toHaveValue('10.00')
  const guardar = page.getByRole('button', { name: 'Guardar tope' })
  await expect(guardar).toBeDisabled()
  await tope.fill('150')
  await expect(tope).toHaveAttribute('aria-invalid', 'true')
  await expect(guardar).toBeDisabled()
  await tope.fill('15')
  await guardar.click()
  await expect(aviso(page, /El mesero descuenta hasta 15\.0 %/u)).toBeVisible()
  await expect.poll(async () => (await api(local).get('/restaurant')).max_waiter_discount_percent).toBe('15.00')
  await evidencia(page, 'ges-02-2-tope')
  await plegable.click()
  await expect(tope).toBeHidden()

  // Con un pedido abierto, cerrar avisa que queda para el turno siguiente.
  await page.getByLabel('Efectivo inicial').fill('80,50')
  await page.getByRole('button', { name: 'Abrir caja' }).click()
  await expect(aviso(page, /Caja abierta con S\/\s*80\.50/u)).toBeVisible()
  await api(local, local.mesero).post('/orders', {
    type: 'dine_in',
    table_id: local.mesa('3').id,
    items: [{ menu_item_id: local.plato('Chicha morada').id, quantity: 1, notes: '' }],
  })
  await page.reload()
  await expect(page.getByText(/Hay 1 pedido sin cobrar\.\s*Puedes cerrar igual/u)).toBeVisible()
  await page.getByLabel('Efectivo contado').fill('80.50')
  await expect(page.getByText('Cuadra')).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar caja' }).click()
  await expect(aviso(page, 'Caja cerrada. Cuadra.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Cerró Encargada Prueba/u })).toContainText('Cuadró')
})

test('GES-03 el historial de turnos se pagina y la caja avisa si el servidor falla', async ({ page, local }) => {
  cubre('funcion:caja.historial-paginar', 'estado:caja.error', 'estado:caja.historial-error')
  const encargado = api(local)
  for (let turno = 1; turno <= 11; turno += 1) {
    await encargado.post('/cash/open', { opening_amount: String(turno), notes: '' })
    await encargado.post('/cash/close', { counted_cash: String(turno), notes: '' })
  }
  await abrirComo(page, local.encargado, '/caja')
  const historial = page.getByRole('heading', { name: 'Turnos anteriores' }).locator('xpath=../../..')
  const paginacion = historial.getByRole('navigation', { name: 'Paginación' })
  await expect(paginacion).toContainText('Página 1 de 2')
  await expect(historial.getByRole('button', { name: /Cerró Encargada Prueba/u })).toHaveCount(10)
  await expect(paginacion.getByRole('button', { name: 'Anterior' })).toBeDisabled()
  await paginacion.getByRole('button', { name: 'Siguiente' }).click()
  await expect(paginacion).toContainText('Página 2 de 2')
  await expect(historial.getByRole('button', { name: /Cerró Encargada Prueba/u })).toHaveCount(1)
  await expect(historial.getByRole('button', { name: /Cerró Encargada Prueba/u })).toContainText(soles('1.00'))
  await expect(paginacion.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  await evidencia(page, 'ges-03-1-historial-pagina-2')
  await paginacion.getByRole('button', { name: 'Anterior' }).click()
  await expect(paginacion).toContainText('Página 1 de 2')

  // Si el servidor falla, cada bloque lo dice en vez de quedarse cargando.
  await fallaServidor(page, '/cash/current')
  await fallaServidor(page, '/cash/sessions')
  await page.reload()
  await expect(page.getByText('No se pudo cargar la caja.')).toBeVisible()
  await expect(page.getByText('No se pudieron cargar los turnos.')).toBeVisible()
  await evidencia(page, 'ges-03-2-error')
})
