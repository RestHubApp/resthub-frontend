// HU35: la boleta o la factura de un pedido pagado. La boleta va sin
// documento hasta S/ 700; por encima exige DNI, CE o RUC; la factura exige
// RUC válido y razón social. Sin proveedor configurado, el comprobante queda
// guardado como «Sin enviar (sin proveedor)», que es hasta donde llega aquí.
import type { Locator, Page } from '@playwright/test'

import { covers } from '../soporte/cobertura'
import { openAs, evidence, expect, test } from '../soporte/fixtures'
import { api, orderPaid } from '../soporte/salon'

async function openInvoice(page: Page, number: number): Promise<Locator> {
  await page.getByRole('button', { name: 'Emitir boleta o factura' }).click()
  const windowValue = page.getByRole('dialog', { name: `Comprobante del pedido #${String(number)}` })
  await expect(windowValue).toBeVisible()
  return windowValue
}

function invoiceOf(local: Parameters<typeof api>[0], orderId: unknown) {
  return api(local).get(`/billing/orders/${String(orderId)}/invoice`)
}

test('SAL-25 el mesero emite una boleta a «clientes varios» y queda sin enviar por falta de proveedor @movil', async ({
  page,
  restaurantWithCashRegister: local,
}) => {
  covers('dialogo:orders/invoice/InvoiceDialog', 'funcion:comprobante.boleta-sin-documento', 'funcion:comprobante.simulado')
  const order = await orderPaid(local, local.table('1'), [{ dish: local.dish('Lomo saltado') }])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)

  // Cancelar no emite nada.
  let windowValue = await openInvoice(page, 1)
  await windowValue.getByRole('button', { name: 'Cancelar' }).click()
  await expect(windowValue).toBeHidden()

  windowValue = await openInvoice(page, 1)
  await expect(windowValue).toContainText(/Total S\/\s*32\.00 \(IGV incluido\)/u)
  await expect(windowValue.getByRole('button', { name: 'Boleta', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const documentValue = windowValue.getByRole('combobox', { name: 'Documento del cliente' })
  await expect(documentValue).toHaveValue('none')
  // Con DNI (opcional en una boleta chica) pide número y nombre antes de emitir.
  await documentValue.selectOption('dni')
  await expect(windowValue.getByText('Escribe el número de documento y el nombre del cliente para emitir.')).toBeVisible()
  await expect(windowValue.getByRole('button', { name: 'Emitir boleta' })).toBeDisabled()
  await documentValue.selectOption('none')
  await expect(windowValue.getByRole('textbox', { name: 'Número de documento' })).toHaveCount(0)
  await evidence(page, 'sal-25-1-boleta')
  await windowValue.getByRole('button', { name: 'Emitir boleta' }).click()

  await expect(windowValue).toBeHidden()
  await expect(page.getByText(/Boleta de venta B\w+-\d+/u)).toBeVisible()
  await expect(page.getByText('Sin enviar (sin proveedor)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Emitir boleta o factura' })).toHaveCount(0)
  await evidence(page, 'sal-25-2-simulada')
  const issued = await invoiceOf(local, order.id)
  expect(issued).toMatchObject({ kind: 'boleta', status: 'simulated', customer_document_type: 'none', total: '32.00' })
  // La base imponible y el IGV los calcula el sistema y suman el total.
  expect(Math.round((Number(issued.taxable) + Number(issued.igv)) * 100)).toBe(3200)
  expect(Number(issued.igv)).toBeGreaterThan(0)
})

test('SAL-26 una boleta de más de S/ 700 exige el documento del cliente @movil', async ({ page, restaurantWithCashRegister: local }) => {
  covers('funcion:comprobante.boleta-sobre-tope', 'funcion:comprobante.documento-invalido')
  const order = await orderPaid(local, local.table('2'), [{ dish: local.dish('Lomo saltado'), quantity: 25 }])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  const windowValue = await openInvoice(page, 1)
  await expect(windowValue).toContainText(/Total S\/\s*800\.00/u)
  const documentValue = windowValue.getByRole('combobox', { name: 'Documento del cliente' })
  await expect(documentValue).toHaveValue('dni')
  await expect(documentValue.getByRole('option')).toHaveText(['DNI', 'Carné de extranjería', 'RUC'])
  const issue = windowValue.getByRole('button', { name: 'Emitir boleta' })
  await expect(issue).toBeDisabled()

  await windowValue.getByRole('textbox', { name: 'Número de documento' }).fill('1234')
  await windowValue.getByRole('textbox', { name: 'Nombre' }).fill('Carmen Rojas')
  await issue.click()
  await expect(windowValue.getByText('El número de DNI no es válido.')).toBeVisible()
  await evidence(page, 'sal-26-1-dni-invalido')
  expect(await api(local).status(`/billing/orders/${String(order.id)}/invoice`)).toBe(404)

  await windowValue.getByRole('textbox', { name: 'Número de documento' }).fill('45678912')
  await issue.click()
  await expect(windowValue).toBeHidden()
  await expect(page.getByText('Sin enviar (sin proveedor)')).toBeVisible()
  const issued = await invoiceOf(local, order.id)
  expect(issued).toMatchObject({
    kind: 'boleta',
    status: 'simulated',
    customer_document_type: 'dni',
    customer_document_number: '45678912',
    customer_name: 'Carmen Rojas',
  })
})

test('SAL-27 una factura exige un RUC válido y la razón social @movil', async ({ page, restaurantWithCashRegister: local }) => {
  covers('funcion:comprobante.factura', 'funcion:comprobante.factura-ruc-invalido')
  const order = await orderPaid(local, local.table('3'), [
    { dish: local.dish('Ceviche clásico') },
    { dish: local.dish('Chicha morada') },
  ])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  const windowValue = await openInvoice(page, 1)
  await windowValue.getByRole('button', { name: 'Factura', exact: true }).click()
  await expect(windowValue.getByRole('combobox', { name: 'Documento del cliente' })).toHaveCount(0)
  await expect(windowValue.getByText('Escribe el RUC y la razón social del cliente para emitir.')).toBeVisible()
  const issue = windowValue.getByRole('button', { name: 'Emitir factura' })
  await windowValue.getByRole('textbox', { name: 'RUC' }).fill('12345678901')
  await expect(issue).toBeDisabled()
  await windowValue.getByRole('textbox', { name: 'Razón social' }).fill('Inversiones Lima S.A.C.')
  await windowValue.getByRole('textbox', { name: 'Dirección fiscal (opcional)' }).fill('Av. Javier Prado 100, San Isidro')
  await issue.click()
  await expect(windowValue.getByText('Una factura necesita el RUC del cliente (11 dígitos).')).toBeVisible()
  await evidence(page, 'sal-27-1-ruc-invalido')

  await windowValue.getByRole('textbox', { name: 'RUC' }).fill('20100070970')
  await issue.click()
  await expect(windowValue).toBeHidden()
  await expect(page.getByText(/Factura F\w+-\d+/u)).toBeVisible()
  await expect(page.getByText('Sin enviar (sin proveedor)')).toBeVisible()
  await evidence(page, 'sal-27-2-factura')
  const issued = await invoiceOf(local, order.id)
  expect(issued).toMatchObject({
    kind: 'factura',
    status: 'simulated',
    customer_document_type: 'ruc',
    customer_document_number: '20100070970',
    customer_name: 'Inversiones Lima S.A.C.',
    customer_address: 'Av. Javier Prado 100, San Isidro',
  })
})
