// HU35: los comprobantes electrónicos. Datos fiscales del local, la lista de
// lo emitido y su estado ante SUNAT, el reenvío y la hoja impresa. Sin token
// del proveedor el comprobante queda «Sin enviar (sin proveedor)», simulado.
import { defined } from '../support/defined'
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, countPrints, issueSalesReceipt, failureServer, id, prints, soles, sell } from '../support/management'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-19 el encargado carga los datos fiscales, reenvía un comprobante que queda simulado sin proveedor y lo imprime', async ({ page, restaurantWithCashRegister: local }) => {
  covers(
    'ruta:/comprobantes',
    'hoja:billing/BillingView',
    'ruta:/comprobantes/:invoiceId/imprimir',
    'funcion:comprobantes.datos-fiscales',
    'funcion:comprobantes.validar-datos-fiscales',
    'funcion:comprobantes.lista',
    'funcion:comprobantes.reenviar',
    'funcion:comprobantes.imprimir',
    'estado:comprobante-impreso.error',
  )
  const order = await sell(local, { table: local.table('1'), items: [{ dish: local.dish('Lomo saltado') }, { dish: local.dish('Chicha morada') }] })
  const salesReceipt = await issueSalesReceipt(local, id(order))
  expect(salesReceipt).toMatchObject({ status: 'simulated', total: '40.00' })
  const code = salesReceipt.code
  await countPrints(page)
  await openAs(page, local.owner, '/comprobantes')
  await expect(page.getByRole('heading', { level: 1, name: 'Comprobantes' })).toBeVisible()

  const row = page.getByRole('listitem').filter({ hasText: code })
  await expect(row).toContainText(soles('40.00'))
  await expect(row).toContainText('Sin enviar (sin proveedor)')

  // Datos fiscales: en una hoja; el botón avisa mientras falte algo para enviar a SUNAT.
  await expect(page.getByRole('button', { name: /Datos fiscales/u })).toContainText('Falta completar')
  await page.getByRole('button', { name: /Datos fiscales/u }).click()
  const fiscal = page.getByRole('dialog', { name: 'Datos fiscales' })
  await fiscal.getByLabel('RUC del local').fill('123')
  await fiscal.getByLabel('Serie de boletas').fill('X001')
  await fiscal.getByRole('button', { name: 'Guardar datos fiscales' }).click()
  await expect(fiscal.getByText('El RUC tiene 11 dígitos y empieza en 10 o 20')).toBeVisible()
  await expect(fiscal.getByText('Cuatro caracteres, empieza con B')).toBeVisible()
  await fiscal.getByLabel('RUC del local').fill('20123456789')
  await fiscal.getByLabel('Razón social').fill('Restaurante E2E S.A.C.')
  await fiscal.getByLabel('Dirección fiscal').fill('Av. Larco 123, Miraflores')
  await fiscal.getByLabel('Serie de boletas').fill('B001')
  await expect(fiscal.getByText('Todavía no cargado.')).toBeVisible()
  await evidence(page, 'ges-19-1-datos-fiscales')
  await fiscal.getByRole('button', { name: 'Guardar datos fiscales' }).click()
  await expect(notice(page, 'Datos fiscales guardados.')).toBeVisible()
  await expect(fiscal).toBeHidden()
  const settings = await api(local).get('/billing/settings')
  expect(settings).toMatchObject({ ruc: '20123456789', legal_name: 'Restaurante E2E S.A.C.', is_ready: false, has_provider_token: false })

  // Sin proveedor, reenviar deja el comprobante simulado: no se manda a SUNAT.
  await row.getByRole('button', { name: 'Reenviar' }).click()
  await expect(notice(page, `${code}: Sin enviar (sin proveedor).`)).toBeVisible()
  await expect(row).toContainText('Sin enviar (sin proveedor)')
  await evidence(page, 'ges-19-2-comprobantes')

  // La hoja impresa lleva el emisor, el detalle, la base imponible y el IGV.
  await row.getByRole('link', { name: 'Imprimir' }).click()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(page).toHaveURL(new RegExp(`/comprobantes/${String(salesReceipt.id)}/imprimir$`, 'u'))
  const sheet = page.locator('#hoja-impresa')
  await expect(sheet).toContainText('Restaurante E2E S.A.C.')
  await expect(sheet).toContainText('RUC 20123456789')
  await expect(sheet).toContainText('Boleta de venta electrónica')
  await expect(sheet).toContainText(code)
  await expect(sheet).toContainText('1 × Lomo saltado')
  await expect(sheet).toContainText(soles(salesReceipt.taxable))
  await expect(sheet).toContainText(soles(salesReceipt.igv))
  await expect(sheet).toContainText('IGV 18.0 %')
  await expect(sheet).toContainText('Estado: Sin enviar (sin proveedor).')
  await expect.poll(() => prints(page)).toBe(1)
  await evidence(page, 'ges-19-3-hoja-impresa')
  await page.getByRole('button', { name: 'Imprimir' }).click()
  await expect.poll(() => prints(page)).toBe(2)

  // Un comprobante que no existe no se imprime.
  await page.goto('/comprobantes/99999999/imprimir')
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
  expect(await prints(page)).toBe(0)
})

test('GES-20 los comprobantes se paginan de a 25 y la lista avisa si el servidor falla', async ({ page, restaurantWithCashRegister: local }) => {
  covers('funcion:comprobantes.paginar', 'estado:comprobantes.error')
  const codes: string[] = []
  for (let n = 0; n < 26; n += 1) {
    const order = await sell(local, { table: local.table('2'), items: [{ dish: local.dish('Inca Kola 500 ml') }] })
    codes.push((await issueSalesReceipt(local, id(order))).code)
  }
  await openAs(page, local.owner, '/comprobantes')
  const issued = page.getByRole('heading', { name: 'Emitidos' }).locator('xpath=../../..')
  const pages = issued.getByRole('navigation', { name: 'Paginación' })
  await expect(pages).toContainText('Página 1 de 2')
  await expect(issued.getByRole('listitem')).toHaveCount(25)
  await expect(issued.getByRole('listitem').first()).toContainText(defined(codes[25]))
  await pages.getByRole('button', { name: 'Siguiente' }).click()
  await expect(pages).toContainText('Página 2 de 2')
  await expect(issued.getByRole('listitem')).toHaveCount(1)
  await expect(issued.getByRole('listitem')).toContainText(defined(codes[0]))
  await evidence(page, 'ges-20-1-pagina-2')

  await failureServer(page, '/billing/invoices')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})
