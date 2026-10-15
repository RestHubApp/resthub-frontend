// Regresión visual de las rondas de cocina y de la ventana para anular un
// plato. Depende del backend `feat/rondas-cocina`: sin `kitchen_round` en el
// pedido se salta sola. Sus líneas base se generan cuando ese backend llegue a
// develop.
import type { OrderResponse } from '../../src/api/types'
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { api, id } from '../support/management'
import { capture, captureWindow, expect, deadline, test } from './capture'
import { inKitchen } from './prepare'

test('VIS-22 la cocina con una ronda nueva y la ventana para anular un plato', async ({ page, local }) => {
  deadline(90_000)
  covers('dialogo:orders/detail/VoidItemDialog')
  const order = await inKitchen(local, local.table('1'), [{ dish: local.dish('Lomo saltado') }])
  const second = await api(local, local.waiter).post<OrderResponse>(`/orders/${String(id(order))}/items`, {
    items: [{ menu_item_id: local.dish('Chicha morada').id, quantity: 1, notes: '', modifiers: [] }],
  })
  // Sin las rondas en el backend de develop no hay qué probar: se activa sola cuando lleguen.
  test.skip(!('kitchen_round' in second), 'El backend todavía no tiene las rondas de cocina (feat/rondas-cocina).')

  await openAs(page, local.owner, '/cocina')
  await expect(page.getByRole('region', { name: /^Agregado \(ronda 2\)/u })).toBeVisible()
  await capture(page, 'cocina-ronda-nueva')

  await page.goto(`/pedidos/${String(id(order))}`)
  await page.getByRole('button', { name: 'Anular Chicha morada' }).click()
  const dialog = page.getByRole('dialog', { name: '¿Anular 1 × Chicha morada?' })
  await dialog.getByRole('button', { name: 'Sin insumo' }).click()
  await captureWindow(dialog, 'dialogo-anular-plato')
})
