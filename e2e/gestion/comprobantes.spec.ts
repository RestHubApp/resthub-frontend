// HU35: los comprobantes electrónicos. Datos fiscales del local, la lista de
// lo emitido y su estado ante SUNAT, el reenvío y la hoja impresa. Sin token
// del proveedor el comprobante queda «Sin enviar (sin proveedor)», simulado.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, contarImpresiones, emitirBoleta, fallaServidor, id, impresiones, soles, vender } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-19 el encargado carga los datos fiscales, reenvía un comprobante que queda simulado sin proveedor y lo imprime', async ({ page, localConCaja: local }) => {
  cubre(
    'ruta:/comprobantes',
    'ruta:/comprobantes/:invoiceId/imprimir',
    'funcion:comprobantes.datos-fiscales',
    'funcion:comprobantes.validar-datos-fiscales',
    'funcion:comprobantes.lista',
    'funcion:comprobantes.reenviar',
    'funcion:comprobantes.imprimir',
    'estado:comprobante-impreso.error',
  )
  const pedido = await vender(local, { mesa: local.mesa('1'), items: [{ plato: local.plato('Lomo saltado') }, { plato: local.plato('Chicha morada') }] })
  const boleta = await emitirBoleta(local, id(pedido))
  expect(boleta).toMatchObject({ status: 'simulated', total: '40.00' })
  const codigo = String(boleta.code)
  await contarImpresiones(page)
  await abrirComo(page, local.encargado, '/comprobantes')
  await expect(page.getByRole('heading', { level: 1, name: 'Comprobantes' })).toBeVisible()

  const fila = page.getByRole('listitem').filter({ hasText: codigo })
  await expect(fila).toContainText(soles('40.00'))
  await expect(fila).toContainText('Sin enviar (sin proveedor)')

  // Datos fiscales: abiertos mientras falte algo para enviar a SUNAT.
  await expect(page.getByRole('button', { name: 'Datos fiscales', exact: true })).toHaveAttribute('aria-expanded', 'true')
  await page.getByLabel('RUC del local').fill('123')
  await page.getByLabel('Serie de boletas').fill('X001')
  await page.getByRole('button', { name: 'Guardar datos fiscales' }).click()
  await expect(page.getByText('El RUC tiene 11 dígitos y empieza en 10 o 20')).toBeVisible()
  await expect(page.getByText('Cuatro caracteres, empieza con B')).toBeVisible()
  await page.getByLabel('RUC del local').fill('20123456789')
  await page.getByLabel('Razón social').fill('Restaurante E2E S.A.C.')
  await page.getByLabel('Dirección fiscal').fill('Av. Larco 123, Miraflores')
  await page.getByLabel('Serie de boletas').fill('B001')
  await expect(page.getByText('Todavía no cargado.')).toBeVisible()
  await evidencia(page, 'ges-19-1-datos-fiscales')
  await page.getByRole('button', { name: 'Guardar datos fiscales' }).click()
  await expect(aviso(page, 'Datos fiscales guardados.')).toBeVisible()
  const ajustes = await api(local).get('/billing/settings')
  expect(ajustes).toMatchObject({ ruc: '20123456789', legal_name: 'Restaurante E2E S.A.C.', is_ready: false, has_provider_token: false })

  // Sin proveedor, reenviar deja el comprobante simulado: no se manda a SUNAT.
  await fila.getByRole('button', { name: 'Reenviar' }).click()
  await expect(aviso(page, `${codigo}: Sin enviar (sin proveedor).`)).toBeVisible()
  await expect(fila).toContainText('Sin enviar (sin proveedor)')
  await evidencia(page, 'ges-19-2-comprobantes')

  // La hoja impresa lleva el emisor, el detalle, la base imponible y el IGV.
  await fila.getByRole('link', { name: 'Imprimir' }).click()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(page).toHaveURL(new RegExp(`/comprobantes/${String(boleta.id)}/imprimir$`, 'u'))
  const hoja = page.locator('#hoja-impresa')
  await expect(hoja).toContainText('Restaurante E2E S.A.C.')
  await expect(hoja).toContainText('RUC 20123456789')
  await expect(hoja).toContainText('Boleta de venta electrónica')
  await expect(hoja).toContainText(codigo)
  await expect(hoja).toContainText('1 × Lomo saltado')
  await expect(hoja).toContainText(soles(String(boleta.taxable)))
  await expect(hoja).toContainText(soles(String(boleta.igv)))
  await expect(hoja).toContainText('IGV 18.0 %')
  await expect(hoja).toContainText('Estado: Sin enviar (sin proveedor).')
  await expect.poll(() => impresiones(page)).toBe(1)
  await evidencia(page, 'ges-19-3-hoja-impresa')
  await page.getByRole('button', { name: 'Imprimir' }).click()
  await expect.poll(() => impresiones(page)).toBe(2)

  // Un comprobante que no existe no se imprime.
  await page.goto('/comprobantes/99999999/imprimir')
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
  expect(await impresiones(page)).toBe(0)
})

test('GES-20 los comprobantes se paginan de a 25 y la lista avisa si el servidor falla', async ({ page, localConCaja: local }) => {
  cubre('funcion:comprobantes.paginar', 'estado:comprobantes.error')
  const codigos: string[] = []
  for (let n = 0; n < 26; n += 1) {
    const pedido = await vender(local, { mesa: local.mesa('2'), items: [{ plato: local.plato('Inca Kola 500 ml') }] })
    codigos.push(String((await emitirBoleta(local, id(pedido))).code))
  }
  await abrirComo(page, local.encargado, '/comprobantes')
  const emitidos = page.getByRole('heading', { name: 'Emitidos' }).locator('xpath=../../..')
  const paginas = emitidos.getByRole('navigation', { name: 'Paginación' })
  await expect(paginas).toContainText('Página 1 de 2')
  await expect(emitidos.getByRole('listitem')).toHaveCount(25)
  await expect(emitidos.getByRole('listitem').first()).toContainText(codigos[25])
  await paginas.getByRole('button', { name: 'Siguiente' }).click()
  await expect(paginas).toContainText('Página 2 de 2')
  await expect(emitidos.getByRole('listitem')).toHaveCount(1)
  await expect(emitidos.getByRole('listitem')).toContainText(codigos[0])
  await evidencia(page, 'ges-20-1-pagina-2')

  await fallaServidor(page, '/billing/invoices')
  await page.reload()
  await expect(page.getByRole('main').getByRole('button', { name: 'Reintentar' })).toBeVisible()
})
