// Regresión visual de la anulación de un cobro (RFS-25): la ventana con el
// motivo y el detalle con el cobro tachado.
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { id, orderPaid } from '../support/floor'
import { capture, captureWindow, expect, deadline, test } from './capture'

test('VIS-29 la ventana para anular un cobro y el pedido con el cobro anulado', async ({ page, restaurantWithCashRegister: local }) => {
  deadline(90_000)
  covers('dialogo:orders/charge/VoidPaymentButton')
  const order = await orderPaid(local, local.table('1'), [{ dish: local.dish('Lomo saltado') }])

  await openAs(page, local.owner, `/pedidos/${String(id(order))}`)
  await page.getByRole('button', { name: /^Anular el cobro de/u }).click()
  const dialog = page.getByRole('dialog', { name: /^¿Anular el cobro de/u })
  await dialog.getByRole('button', { name: 'Cobro duplicado' }).click()
  await captureWindow(dialog, 'dialogo-anular-cobro')
  await dialog.getByRole('button', { name: 'Anular cobro' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('region', { name: 'Cobros anulados' })).toBeVisible()
  await capture(page, 'pedido-cobro-anulado')
})
