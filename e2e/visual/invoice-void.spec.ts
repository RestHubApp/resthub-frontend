// Regresión visual de la anulación de comprobantes: la ventana con el motivo,
// el paso con los datos del nuevo y el listado con el anulado y su reemplazo.
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { issueSalesReceipt, id, sell } from '../support/management'
import { capture, captureWindow, expect, deadline, test } from './capture'

test('VIS-25 cambiar una boleta por una factura y el listado con el anulado y su reemplazo', async ({ page, restaurantWithCashRegister: local }) => {
  deadline(120_000)
  covers('dialogo:orders/invoice/InvoiceVoidDialog')
  const order = await sell(local, { table: local.table('1'), items: [{ dish: local.dish('Lomo saltado') }] })
  const salesReceipt = await issueSalesReceipt(local, id(order))

  await openAs(page, local.owner, `/pedidos/${String(id(order))}`)
  await page.getByRole('button', { name: 'Cambiar comprobante' }).click()
  const dialog = page.getByRole('dialog', { name: `Cambiar la boleta ${salesReceipt.code}` })
  await dialog.getByRole('button', { name: 'El cliente pidió factura' }).click()
  await captureWindow(dialog, 'dialogo-cambiar-comprobante-motivo')
  await dialog.getByRole('button', { name: 'Siguiente' }).click()
  await dialog.getByRole('textbox', { name: 'RUC' }).fill('20100070970')
  await dialog.getByRole('textbox', { name: 'Razón social' }).fill('Inversiones Lima S.A.C.')
  await captureWindow(dialog, 'dialogo-cambiar-comprobante-nuevo')
  await dialog.getByRole('button', { name: 'Anular y emitir factura' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText(`Reemplaza a ${salesReceipt.code}`)).toBeVisible()

  await page.goto('/comprobantes')
  await expect(page.getByText('Anulado: El cliente pidió factura')).toBeVisible()
  await expect(page.getByText(`Reemplaza a ${salesReceipt.code}`)).toBeVisible()
  await capture(page, 'comprobantes-anulado-y-reemplazo')
})
