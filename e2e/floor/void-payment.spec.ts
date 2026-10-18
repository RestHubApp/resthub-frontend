// RFS-25: el encargado anula un cobro mal hecho con su motivo. El cobro queda a
// la vista tachado, sale de la caja y el pedido vuelve a deber ese monto.
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { id, orderPaid, readOrder } from '../support/floor'

test('SAL-44 el encargado anula un cobro con un motivo rápido y el pedido vuelve a deberlo', async ({ page, restaurantWithCashRegister: local }) => {
  covers('dialogo:orders/charge/VoidPaymentButton')
  const order = await orderPaid(local, local.table('1'), [{ dish: local.dish('Chicha morada') }])

  await openAs(page, local.owner, `/pedidos/${String(id(order))}`)
  await page.getByRole('button', { name: /^Anular el cobro de S\/\s?[\d.]+ en Tarjeta$/u }).click()
  const dialog = page.getByRole('dialog', { name: /^¿Anular el cobro de/u })
  await dialog.getByRole('button', { name: 'Medio de pago equivocado' }).click()
  await evidence(page, 'sal-44-1-motivo')
  await dialog.getByRole('button', { name: 'Anular cobro' }).click()

  await expect(notice(page, /^Cobro de S\/\s?[\d.]+ anulado/u)).toBeVisible()
  await expect(dialog).toBeHidden()
  const voided = page.getByRole('region', { name: 'Cobros anulados' })
  await expect(voided.getByText(/: Medio de pago equivocado$/u)).toBeVisible()
  await evidence(page, 'sal-44-2-anulado')
  const actual = await readOrder(local, id(order))
  expect(actual).toMatchObject({ status: 'served', paid_amount: '0.00', balance: order.total, payments: [] })
  expect(actual.voided_payments).toEqual([expect.objectContaining({ method: 'card', void_reason: 'Medio de pago equivocado' })])
})

test('SAL-45 el mesero no ve cómo anular un cobro @mobile', async ({ page, restaurantWithCashRegister: local }) => {
  covers('funcion:pedido.anular-sin-permiso')
  const order = await orderPaid(local, local.table('1'), [{ dish: local.dish('Chicha morada') }])

  await openAs(page, local.waiter, `/pedidos/${String(id(order))}`)
  await expect(page.getByText('Pagado').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^Anular el cobro/u })).toHaveCount(0)
})
