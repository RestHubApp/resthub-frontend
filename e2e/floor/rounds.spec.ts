// Rondas de cocina y anular un plato ya enviado: la cocina ve aparte lo que se
// agregó después del primer envío, y el encargado anula un plato con su motivo.
import type { OrderResponse } from '../../src/api/types'
import type { Local } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, id, orderInTable, readOrder } from '../support/floor'

/** Un pedido que fue a cocina con un lomo y al que después se le agregó una chicha (ronda 2). */
async function withSecondRound(local: Local): Promise<{ first: OrderResponse; second: OrderResponse }> {
  const first = await orderInTable(local, local.table('1'), [{ dish: local.dish('Lomo saltado') }])
  const second = await api(local, local.waiter).post<OrderResponse>(`/orders/${String(id(first))}/items`, {
    items: [{ menu_item_id: local.dish('Chicha morada').id, quantity: 1, notes: '', modifiers: [] }],
  })
  return { first, second }
}

test('SAL-41 en el tablero, la cocina ve lo agregado en la ronda 2 aparte, con «Nuevo», y lo anterior plegado', async ({ page, local }) => {
  covers('funcion:cocina.rondas', 'desplegable:orders/RoundGroups')
  const { second } = await withSecondRound(local)

  await openAs(page, local.kitchen, '/tablero')
  const card = page.getByRole('article', { name: `Pedido #${String(second.number)}` })
  const added = card.getByRole('region', { name: /^Agregado \(ronda 2\)/u })
  await expect(added.getByText('Chicha morada')).toBeVisible()
  await expect(added.getByText('Nuevo')).toBeVisible()
  await expect(card.getByText('Lomo saltado')).toBeHidden()
  await card.getByText('Ya enviados (1)').click()
  await expect(card.getByText('Lomo saltado')).toBeVisible()
  await evidence(page, 'sal-41-1-ronda')
})

test('SAL-42 el encargado anula un plato ya enviado con un motivo rápido y sale del total', async ({ page, local }) => {
  covers('dialogo:orders/detail/VoidItemDialog', 'funcion:pedido.anular-plato')
  const { first, second } = await withSecondRound(local)

  await openAs(page, local.owner, `/pedidos/${String(id(second))}`)
  await page.getByRole('button', { name: 'Anular Chicha morada' }).click()
  const dialog = page.getByRole('dialog', { name: '¿Anular 1 × Chicha morada?' })
  await dialog.getByRole('button', { name: 'Anular plato' }).click()
  await expect(dialog.getByText('Escribe el motivo')).toBeVisible()
  await dialog.getByRole('button', { name: 'Sin insumo' }).click()
  await evidence(page, 'sal-42-1-motivo')
  await dialog.getByRole('button', { name: 'Anular plato' }).click()

  await expect(notice(page, 'Chicha morada anulado.')).toBeVisible()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Anulado: Sin insumo')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Anular Chicha morada' })).toHaveCount(0)
  await evidence(page, 'sal-42-2-anulado')
  const actual = await readOrder(local, id(second))
  expect(actual).toMatchObject({ kitchen_round: 2, total: first.total, item_count: first.item_count })
  expect(actual.items).toContainEqual(expect.objectContaining({ name: 'Chicha morada', void_reason: 'Sin insumo' }))
})

test('SAL-43 el mesero no ve cómo anular un plato @mobile', async ({ page, local }) => {
  covers('funcion:pedido.anular-sin-permiso')
  const { second } = await withSecondRound(local)

  await openAs(page, local.waiter, `/pedidos/${String(id(second))}`)
  await expect(page.getByText('Chicha morada')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Anular Chicha morada' })).toHaveCount(0)
})
