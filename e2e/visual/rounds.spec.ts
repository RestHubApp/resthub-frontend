// Regresión visual de las rondas de cocina y de la ventana para anular un
// plato.
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { api, id } from '../support/management'
import { capture, captureWindow, expect, deadline, test } from './capture'
import { inKitchen } from './prepare'

test('VIS-22 la cocina con una ronda nueva y la ventana para anular un plato', async ({ page, local }) => {
  deadline(90_000)
  covers('dialogo:orders/detail/VoidItemDialog')
  const order = await inKitchen(local, local.table('1'), [{ dish: local.dish('Lomo saltado') }])
  await api(local, local.waiter).post(`/orders/${String(id(order))}/items`, {
    items: [{ menu_item_id: local.dish('Chicha morada').id, quantity: 1, notes: '', modifiers: [] }],
  })

  await openAs(page, local.owner, '/cocina')
  await expect(page.getByRole('region', { name: /^Agregado \(ronda 2\)/u })).toBeVisible()
  await capture(page, 'cocina-ronda-nueva')

  await page.goto(`/pedidos/${String(id(order))}`)
  await page.getByRole('button', { name: 'Anular Chicha morada' }).click()
  const dialog = page.getByRole('dialog', { name: '¿Anular 1 × Chicha morada?' })
  await dialog.getByRole('button', { name: 'Sin insumo' }).click()
  await captureWindow(dialog, 'dialogo-anular-plato')
})
