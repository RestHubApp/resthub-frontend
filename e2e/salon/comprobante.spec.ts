// HU35: la boleta o la factura de un pedido pagado. La boleta va sin
// documento hasta S/ 700; por encima exige DNI, CE o RUC; la factura exige
// RUC válido y razón social. Sin proveedor configurado, el comprobante queda
// guardado como «Sin enviar (sin proveedor)», que es hasta donde llega aquí.
import type { Locator, Page } from '@playwright/test'

import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'
import { api, pedidoPagado } from '../soporte/salon'

async function abrirComprobante(page: Page, numero: number): Promise<Locator> {
  await page.getByRole('button', { name: 'Emitir boleta o factura' }).click()
  const ventana = page.getByRole('dialog', { name: `Comprobante del pedido #${String(numero)}` })
  await expect(ventana).toBeVisible()
  return ventana
}

function comprobanteDe(local: Parameters<typeof api>[0], pedidoId: unknown) {
  return api(local).get(`/billing/orders/${String(pedidoId)}/invoice`)
}

test('SAL-25 el mesero emite una boleta a «clientes varios» y queda sin enviar por falta de proveedor @movil', async ({
  page,
  localConCaja: local,
}) => {
  cubre('dialogo:orders/invoice/InvoiceDialog', 'funcion:comprobante.boleta-sin-documento', 'funcion:comprobante.simulado')
  const pedido = await pedidoPagado(local, local.mesa('1'), [{ plato: local.plato('Lomo saltado') }])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)

  // Cancelar no emite nada.
  let ventana = await abrirComprobante(page, 1)
  await ventana.getByRole('button', { name: 'Cancelar' }).click()
  await expect(ventana).toBeHidden()

  ventana = await abrirComprobante(page, 1)
  await expect(ventana).toContainText(/Total S\/\s*32\.00 \(IGV incluido\)/u)
  await expect(ventana.getByRole('button', { name: 'Boleta', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const documento = ventana.getByRole('combobox', { name: 'Documento del cliente' })
  await expect(documento).toHaveValue('none')
  // Con DNI (opcional en una boleta chica) pide número y nombre antes de emitir.
  await documento.selectOption('dni')
  await expect(ventana.getByText('Escribe el número de documento y el nombre del cliente para emitir.')).toBeVisible()
  await expect(ventana.getByRole('button', { name: 'Emitir boleta' })).toBeDisabled()
  await documento.selectOption('none')
  await expect(ventana.getByRole('textbox', { name: 'Número de documento' })).toHaveCount(0)
  await evidencia(page, 'sal-25-1-boleta')
  await ventana.getByRole('button', { name: 'Emitir boleta' }).click()

  await expect(ventana).toBeHidden()
  await expect(page.getByText(/Boleta de venta B\w+-\d+/u)).toBeVisible()
  await expect(page.getByText('Sin enviar (sin proveedor)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Emitir boleta o factura' })).toHaveCount(0)
  await evidencia(page, 'sal-25-2-simulada')
  const emitido = await comprobanteDe(local, pedido.id)
  expect(emitido).toMatchObject({ kind: 'boleta', status: 'simulated', customer_document_type: 'none', total: '32.00' })
  // La base imponible y el IGV los calcula el sistema y suman el total.
  expect(Math.round((Number(emitido.taxable) + Number(emitido.igv)) * 100)).toBe(3200)
  expect(Number(emitido.igv)).toBeGreaterThan(0)
})

test('SAL-26 una boleta de más de S/ 700 exige el documento del cliente @movil', async ({ page, localConCaja: local }) => {
  cubre('funcion:comprobante.boleta-sobre-tope', 'funcion:comprobante.documento-invalido')
  const pedido = await pedidoPagado(local, local.mesa('2'), [{ plato: local.plato('Lomo saltado'), cantidad: 25 }])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  const ventana = await abrirComprobante(page, 1)
  await expect(ventana).toContainText(/Total S\/\s*800\.00/u)
  const documento = ventana.getByRole('combobox', { name: 'Documento del cliente' })
  await expect(documento).toHaveValue('dni')
  await expect(documento.getByRole('option')).toHaveText(['DNI', 'Carné de extranjería', 'RUC'])
  const emitir = ventana.getByRole('button', { name: 'Emitir boleta' })
  await expect(emitir).toBeDisabled()

  await ventana.getByRole('textbox', { name: 'Número de documento' }).fill('1234')
  await ventana.getByRole('textbox', { name: 'Nombre' }).fill('Carmen Rojas')
  await emitir.click()
  await expect(ventana.getByText('El número de DNI no es válido.')).toBeVisible()
  await evidencia(page, 'sal-26-1-dni-invalido')
  expect(await api(local).estado(`/billing/orders/${String(pedido.id)}/invoice`)).toBe(404)

  await ventana.getByRole('textbox', { name: 'Número de documento' }).fill('45678912')
  await emitir.click()
  await expect(ventana).toBeHidden()
  await expect(page.getByText('Sin enviar (sin proveedor)')).toBeVisible()
  const emitido = await comprobanteDe(local, pedido.id)
  expect(emitido).toMatchObject({
    kind: 'boleta',
    status: 'simulated',
    customer_document_type: 'dni',
    customer_document_number: '45678912',
    customer_name: 'Carmen Rojas',
  })
})

test('SAL-27 una factura exige un RUC válido y la razón social @movil', async ({ page, localConCaja: local }) => {
  cubre('funcion:comprobante.factura', 'funcion:comprobante.factura-ruc-invalido')
  const pedido = await pedidoPagado(local, local.mesa('3'), [
    { plato: local.plato('Ceviche clásico') },
    { plato: local.plato('Chicha morada') },
  ])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  const ventana = await abrirComprobante(page, 1)
  await ventana.getByRole('button', { name: 'Factura', exact: true }).click()
  await expect(ventana.getByRole('combobox', { name: 'Documento del cliente' })).toHaveCount(0)
  await expect(ventana.getByText('Escribe el RUC y la razón social del cliente para emitir.')).toBeVisible()
  const emitir = ventana.getByRole('button', { name: 'Emitir factura' })
  await ventana.getByRole('textbox', { name: 'RUC' }).fill('12345678901')
  await expect(emitir).toBeDisabled()
  await ventana.getByRole('textbox', { name: 'Razón social' }).fill('Inversiones Lima S.A.C.')
  await ventana.getByRole('textbox', { name: 'Dirección fiscal (opcional)' }).fill('Av. Javier Prado 100, San Isidro')
  await emitir.click()
  await expect(ventana.getByText('Una factura necesita el RUC del cliente (11 dígitos).')).toBeVisible()
  await evidencia(page, 'sal-27-1-ruc-invalido')

  await ventana.getByRole('textbox', { name: 'RUC' }).fill('20100070970')
  await emitir.click()
  await expect(ventana).toBeHidden()
  await expect(page.getByText(/Factura F\w+-\d+/u)).toBeVisible()
  await expect(page.getByText('Sin enviar (sin proveedor)')).toBeVisible()
  await evidencia(page, 'sal-27-2-factura')
  const emitido = await comprobanteDe(local, pedido.id)
  expect(emitido).toMatchObject({
    kind: 'factura',
    status: 'simulated',
    customer_document_type: 'ruc',
    customer_document_number: '20100070970',
    customer_name: 'Inversiones Lima S.A.C.',
    customer_address: 'Av. Javier Prado 100, San Isidro',
  })
})
