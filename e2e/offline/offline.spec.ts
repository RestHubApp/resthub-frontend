// HU37: el mesero sigue tomando pedidos aunque se caiga la señal. El pedido
// se guarda en el celular con un aviso visible, se envía solo al volver la
// conexión y nunca se duplica.
import type { Page } from '@playwright/test'

import { Customer, type Local } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'

async function tableOrders(local: Local, tableId: number) {
  const active = await new Customer(local.http, local.owner.token).list('/orders/active')
  return active.filter((order) => order.table_id === tableId)
}

async function selectLomo(page: Page) {
  await page.getByRole('link', { name: /Mesa 1/u }).click()
  await expect(page).toHaveURL(/\/pedidos\/nuevo\?mesa=/u)
  await page.getByRole('button', { name: /Lomo saltado/u }).click()
  await expect(page.getByText('1 plato · Ver y anotar')).toBeVisible()
}

test('OFF-01 sin señal el pedido queda en la cola del celular y sale solo al volver, sin duplicarse @mobile', async ({
  page,
  context,
  local,
}) => {
  covers('funcion:pedidos.sin-conexion-encolar', 'funcion:pedidos.sin-conexion-reenviar', 'estado:pedidos.cola-sin-senal')
  await openAs(page, local.waiter, '/pedidos')
  await selectLomo(page)
  await evidence(page, 'off-01-1-plato-elegido')

  await context.setOffline(true)
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()

  // Queda en la cola a la vista, no colgado en «Enviando…».
  const queue = page.getByRole('status').filter({ hasText: '1 pedido espera señal' })
  await expect(queue).toBeVisible()
  await expect(queue).toContainText('Mesa 1')
  await expect(page).toHaveURL(/\/pedidos$/u)
  await evidence(page, 'off-01-2-en-cola')
  expect(await tableOrders(local, local.table('1').id)).toHaveLength(0)

  await context.setOffline(false)
  await expect(page.getByText(/Mesa 1: pedido #\d+ enviado a cocina/u)).toBeVisible()
  await expect(queue).toBeHidden()
  await evidence(page, 'off-01-3-enviado')

  // Un «Reintentar» o una segunda vuelta de la señal no lo vuelve a mandar.
  await context.setOffline(true)
  await context.setOffline(false)
  await expect
    .poll(async () => (await tableOrders(local, local.table('1').id)).map((p) => p.status))
    .toEqual(['in_kitchen'])
  await expect(page.getByRole('link', { name: /Mesa 1/u })).toContainText(/cocina/iu)
})

test('OFF-02 si el pedido llegó pero la respuesta se perdió, el reintento no lo duplica @mobile', async ({
  page,
  local,
}) => {
  covers('funcion:pedidos.sin-conexion-sin-duplicar')
  await openAs(page, local.waiter, '/pedidos')
  await selectLomo(page)

  // El servidor recibe y guarda el pedido, pero al celular no le llega la
  // respuesta: para el celular es igual que no tener señal. Mientras dura el
  // corte, los reintentos automáticos tampoco llegan.
  let sent = 0
  let hasNoSignal = true
  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() !== 'POST' || !hasNoSignal) {
      await route.fallback()
      return
    }
    sent += 1
    if (sent === 1) {
      await route.fetch()
    }
    await route.abort('internetdisconnected')
  })
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  const queue = page.getByRole('status').filter({ hasText: '1 pedido espera señal' })
  await expect(queue).toBeVisible()
  expect(await tableOrders(local, local.table('1').id)).toHaveLength(1)
  await evidence(page, 'off-02-1-en-cola-aunque-llego')

  hasNoSignal = false
  await queue.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText(/Mesa 1: pedido #\d+ enviado a cocina/u)).toBeVisible()
  await expect(queue).toBeHidden()
  const orders = await tableOrders(local, local.table('1').id)
  expect(orders).toHaveLength(1)
  expect(orders[0]?.status).toBe('in_kitchen')
})
