// Enviar un comprobante emitido por correo. El servidor de pruebas no tiene
// Brevo, así que las capacidades y el envío se simulan en el navegador: lo que
// se prueba es la ventana y lo que la persona ve.
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { issueSalesReceipt, id, sell } from '../support/management'

test('GES-38 el encargado envía por correo el comprobante de un pedido pagado', async ({ page, restaurantWithCashRegister: local }) => {
  covers('dialogo:orders/invoice/InvoiceEmailDialog', 'funcion:comprobantes.enviar-correo')
  const order = await sell(local, { table: local.table('1'), items: [{ dish: local.dish('Chicha morada') }] })
  await issueSalesReceipt(local, id(order))
  await page.route('**/api/v1/billing/capabilities', (route) =>
    route.fulfill({ json: { email_enabled: true, email_max_per_hour: 20, archive_enabled: false } }),
  )
  await page.route('**/api/v1/billing/invoices/*/email', (route) =>
    route.fulfill({ json: { sent: true, masked_to: 'r•••@correo.pe' } }),
  )

  await openAs(page, local.owner, `/pedidos/${String(id(order))}`)
  await page.getByRole('button', { name: 'Enviar por correo' }).click()
  const dialog = page.getByRole('dialog', { name: 'Enviar por correo' })
  await expect(dialog.getByRole('button', { name: 'Enviar', exact: true })).toBeDisabled()
  await dialog.getByLabel('Correo de quien lo recibe').fill('rosa@correo.pe')
  await evidence(page, 'ges-38-1-correo')
  await dialog.getByRole('button', { name: 'Enviar', exact: true }).click()

  await expect(notice(page, /enviado a r•••@correo\.pe/u)).toBeVisible()
  await expect(dialog).toBeHidden()
})
