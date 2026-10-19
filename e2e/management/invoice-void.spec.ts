// Anular un comprobante y cambiar una boleta por una factura. En E2E no hay
// Lycet: los comprobantes quedan simulados, nunca fueron válidos ante SUNAT y
// se anulan sin nota de crédito.
import type { Invoice } from '../../src/api/types'
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, issueSalesReceipt, id, sell } from '../support/management'

test.beforeEach(() => {
  test.slow()
})

test('GES-55 el encargado anula desde el pedido una boleta simulada, sin nota, y el pedido vuelve a ofrecer emitir', async ({ page, restaurantWithCashRegister: local }) => {
  covers('dialogo:orders/invoice/InvoiceVoidDialog', 'funcion:comprobantes.anular-sin-nota', 'estado:comprobante.anulado')
  const order = await sell(local, { table: local.table('1'), items: [{ dish: local.dish('Chicha morada') }] })
  const salesReceipt = await issueSalesReceipt(local, id(order))
  expect(salesReceipt.status).toBe('simulated')

  await openAs(page, local.owner, `/pedidos/${String(id(order))}`)
  await page.getByRole('button', { name: 'Anular comprobante' }).click()
  const dialog = page.getByRole('dialog', { name: `Anular la boleta ${salesReceipt.code}` })
  await expect(dialog.getByText(/nunca fue válida ante SUNAT \(es una simulación\): se anula solo en RestHub, sin nota de crédito/u)).toBeVisible()
  // Sin motivo no se anula.
  await dialog.getByRole('button', { name: 'Anular comprobante' }).click()
  await expect(dialog.getByText('Escribe el motivo, de al menos 3 caracteres')).toBeVisible()
  await dialog.getByRole('button', { name: 'Datos del cliente errados' }).click()
  await evidence(page, 'ges-55-1-anular')
  await dialog.getByRole('button', { name: 'Anular comprobante' }).click()

  await expect(notice(page, `La boleta ${salesReceipt.code} quedó anulada.`)).toBeVisible()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Anulado: Datos del cliente errados')).toBeVisible()
  await expect(page.getByText(/Nota de crédito/u)).toBeHidden()
  await expect(page.getByRole('button', { name: 'Emitir boleta o factura' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Anular comprobante' })).toBeHidden()
  await evidence(page, 'ges-55-2-anulado')
  const current = await api(local).get<Invoice>(`/billing/orders/${String(id(order))}/invoice`)
  expect(current).toMatchObject({ id: salesReceipt.id, is_voided: true, void_reason: 'Datos del cliente errados', credit_note: null })
})

test('GES-56 el encargado cambia desde Comprobantes una boleta por una factura, y la nueva dice a cuál reemplaza', async ({ page, restaurantWithCashRegister: local }) => {
  covers('funcion:comprobantes.cambiar', 'funcion:comprobantes.series-nota-credito')
  const order = await sell(local, { table: local.table('2'), items: [{ dish: local.dish('Lomo saltado') }] })
  const salesReceipt = await issueSalesReceipt(local, id(order))

  await openAs(page, local.owner, '/comprobantes')
  const row = page.getByRole('listitem').filter({ hasText: salesReceipt.code })
  await row.getByRole('button', { name: 'Cambiar comprobante' }).click()
  const dialog = page.getByRole('dialog', { name: `Cambiar la boleta ${salesReceipt.code}` })
  await expect(dialog.getByText(/se anula solo en RestHub, sin nota de crédito, y luego se emitirá el comprobante nuevo\./u)).toBeVisible()
  await dialog.getByRole('button', { name: 'El cliente pidió factura' }).click()
  await dialog.getByRole('button', { name: 'Siguiente' }).click()
  await expect(dialog.getByText('Datos del nuevo comprobante')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Factura', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('textbox', { name: 'RUC' }).fill('20100070970')
  await dialog.getByRole('textbox', { name: 'Razón social' }).fill('Inversiones Lima S.A.C.')
  await evidence(page, 'ges-56-1-nuevo-comprobante')
  await dialog.getByRole('button', { name: 'Anular y emitir factura' }).click()

  await expect(notice(page, `La boleta ${salesReceipt.code} quedó anulada y se emitió la factura`)).toBeVisible()
  await expect(dialog).toBeHidden()
  await expect(page.getByText(`Reemplaza a ${salesReceipt.code}`)).toBeVisible()
  await expect(page.getByText('Anulado: El cliente pidió factura')).toBeVisible()
  await evidence(page, 'ges-56-2-reemplazo')
  const current = await api(local).get<Invoice>(`/billing/orders/${String(id(order))}/invoice`)
  expect(current).toMatchObject({ kind: 'factura', customer_document_number: '20100070970', replaces_invoice_id: salesReceipt.id, is_voided: false })

  // Las series de las notas de crédito no pueden repetir la del comprobante que anulan.
  await page.getByRole('button', { name: /Datos fiscales/u }).click()
  const fiscal = page.getByRole('dialog', { name: 'Datos fiscales' })
  await expect(fiscal.getByLabel('Serie de notas de crédito de boletas')).toHaveValue('BC01')
  await expect(fiscal.getByLabel('Serie de notas de crédito de facturas')).toHaveValue('FC01')
  await fiscal.getByLabel('Serie de notas de crédito de facturas').fill('F001')
  await fiscal.getByRole('button', { name: 'Guardar datos fiscales' }).click()
  await expect(fiscal.getByText('Usa una serie distinta a la del comprobante')).toBeVisible()
})
